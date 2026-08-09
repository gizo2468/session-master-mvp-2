import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';
import { StudentSessionStats } from '@/components/coaching/StudentSessionStats';
import { calculateSessionProfit } from '@/utils/sessionCalculations';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import ProfitLossBadge from '@/components/poker/ProfitLossBadge';
import { SharedSessionModal } from '@/components/coaching/SharedSessionModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import PlayerGoalsTasks from '@/components/coaching/PlayerGoalsTasks';
import { IconMenuButton } from '@/components/ui/IconMenuButton';
import { resolveProfilePicture } from '@/hooks/usePlayerCard';
import { ViewOnlyCardBack } from '@/components/PlayerCard/ViewOnlyCardBack';

interface PlayerProfile {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
  email?: string;
  bio?: string;
  default_currency: string;
}

interface SharedSession {
  id: string;
  game_type: string;
  format: string;
  location: string;
  start_time: string;
  end_time?: string;
  buy_in: number;
  cash_out?: number;
  notes?: string;
  currency: string;
  is_active: boolean;
  status: string;
  tables_played: number;
}

interface SessionSummary {
  totalSharedSessions: number;
  totalProfit: number;
  averageSessionLength: number;
  totalHours: number;
  winRate: number;
  mostPlayedFormat: string;
  // New metrics based only on shared sessions
  averageBuyIn: number;
  sessionFrequency: number; // average sessions per unit
  sessionFrequencyUnit: 'wk' | 'mo';
  bestSharedResult: number;
}

const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sharedSessions, setSharedSessions] = useState<SharedSession[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { removeStudent } = useCoachStudent();
  const [unreadBySession, setUnreadBySession] = useState<Record<string, boolean>>({});
  const [backCardOpen, setBackCardOpen] = useState(false);
  const swipeBackRef = useSwipeBack({ fallbackPath: '/dashboard', screenName: 'PlayerProfile' });
  useEffect(() => {
    if (!playerId || !user?.id) return;
    loadPlayerData();
  }, [playerId, user?.id]);

  const loadPlayerData = async () => {
    if (!playerId || !user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Verify coach-student connection
      const { data: connection, error: connectionError } = await supabase
        .from('coach_student_connections')
        .select('id')
        .eq('coach_id', user.id)
        .eq('student_id', playerId)
        .eq('status', 'approved')
        .single();

      if (connectionError || !connection) {
        setError('Access denied. No approved connection found with this player.');
        return;
      }

      // Load player profile with both public and private data
      const [profileResult, privateResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, bio, default_currency')
          .eq('id', playerId)
          .single(),
        supabase
          .rpc('get_student_header_identity', { p_student_id: playerId })
          .single()
      ]);

      if (profileResult.error || !profileResult.data) {
        console.error('Error loading player profile:', profileResult.error);
        setError('Failed to load player profile.');
        return;
      }

      // Combine the data
      const playerData = {
        ...profileResult.data,
        full_name: privateResult.data?.full_name || '',
        profile_picture: resolveProfilePicture(privateResult.data?.profile_picture || null) || undefined,
        email: undefined,
        default_currency: profileResult.data.default_currency || 'USD'
      };

      setPlayer(playerData);

      // Load shared sessions
      const { data: sharedSessionsData, error: sharedError } = await supabase
        .from('shared_sessions')
        .select(`
          session_id,
          sessions!inner(
            id,
            game_type,
            format,
            location,
            start_time,
            end_time,
            buy_in,
            cash_out,
            notes,
            currency,
            is_active,
            status,
            tables_played
          )
        `)
        .eq('player_id', playerId)
        .eq('coach_id', user.id);

      if (sharedError) {
        console.error('Error loading shared sessions:', sharedError);
        toast({
          title: "Warning",
          description: "Failed to load some session data.",
          variant: "destructive",
        });
      }

      const sessions = sharedSessionsData?.map(item => item.sessions).filter(Boolean) || [];
      
      // Sort sessions to prioritize live sessions first
      const sortedSessions = sessions.sort((a, b) => {
        // Live sessions (is_active = true) should appear first
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        // If both have the same active status, maintain original order
        return 0;
      });
      
      setSharedSessions(sortedSessions);
      
      // Load unread flags for these sessions
      await fetchUnreadForSessions(sortedSessions);
      
      // Calculate summary
      calculateSummary(sessions);

    } catch (error) {
      console.error('Error in loadPlayerData:', error);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

const calculateSummary = (sessions: SharedSession[]) => {
  if (sessions.length === 0) {
    setSummary({
      totalSharedSessions: 0,
      totalProfit: 0,
      averageSessionLength: 0,
      totalHours: 0,
      winRate: 0,
      mostPlayedFormat: 'N/A',
      averageBuyIn: 0,
      sessionFrequency: 0,
      sessionFrequencyUnit: 'wk',
      bestSharedResult: 0,
    });
    return;
  }

  const completedSessions = sessions.filter(s => !s.is_active && s.end_time);
  
  const totalProfit = completedSessions.reduce((sum, session) => {
    const profit = (session.cash_out || 0) - (session.buy_in || 0);
    return sum + profit;
  }, 0);

  const totalMinutes = completedSessions.reduce((sum, session) => {
    if (!session.end_time) return sum;
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }, 0);

  const averageSessionLength = completedSessions.length > 0 
    ? Math.round(totalMinutes / completedSessions.length) 
    : 0;

  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const winRate = completedSessions.length > 0 
    ? Math.round((completedSessions.filter(s => (s.cash_out || 0) > (s.buy_in || 0)).length / completedSessions.length) * 100)
    : 0;

  // Find most played format
  const formatCounts = sessions.reduce((acc, session) => {
    acc[session.format] = (acc[session.format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostPlayedFormat = Object.keys(formatCounts).length > 0 
    ? Object.entries(formatCounts).sort(([,a], [,b]) => b - a)[0][0]
    : 'N/A';

  // New metrics
  const averageBuyIn = Math.round(
    sessions.reduce((sum, s) => sum + (s.buy_in || 0), 0) / sessions.length
  );

  // Session Frequency
  const sortedByStart = [...sessions].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const firstDate = new Date(sortedByStart[0].start_time);
  const lastDate = new Date(sortedByStart[sortedByStart.length - 1].start_time);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const spanDays = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / MS_PER_DAY) + 1);
  const useMonthly = spanDays >= 56; // if span >= 8 weeks, show per month
  const denom = useMonthly ? spanDays / 30 : spanDays / 7;
  const sessionFrequency = Math.round((sessions.length / Math.max(1, denom)) * 10) / 10;
  const sessionFrequencyUnit: 'wk' | 'mo' = useMonthly ? 'mo' : 'wk';

  // Best single-session result
  const bestSharedResult = completedSessions.length > 0
    ? Math.max(...completedSessions.map(s => (s.cash_out || 0) - (s.buy_in || 0)))
    : 0;

  setSummary({
    totalSharedSessions: sessions.length,
    totalProfit,
    averageSessionLength,
    totalHours,
    winRate,
    mostPlayedFormat,
    averageBuyIn,
    sessionFrequency,
    sessionFrequencyUnit,
    bestSharedResult,
  });
};
  
  // Load unread flags for a list of sessions using RPC
  const fetchUnreadForSessions = async (sessionsList: SharedSession[]) => {
    if (!sessionsList.length) return;
    try {
      const entries = await Promise.all(
        sessionsList.map(async (s) => {
          const { data, error } = await (supabase as any).rpc('has_unread_for_session', { p_session_id: s.id });
          if (error) {
            console.warn('has_unread_for_session error', error);
          }
          return [s.id, data === true] as const;
        })
      );
      const map: Record<string, boolean> = {};
      entries.forEach(([id, flag]) => { map[id] = flag; });
      setUnreadBySession(map);
    } catch (e) {
      console.warn('Failed loading unread flags', e);
    }
  };

  // When opening a session, mark its unread as read via RPC
  const handleSessionClick = async (sessionId: string) => {
    try {
      await (supabase as any).rpc('mark_unread_for_session', { p_session_id: sessionId });
      setUnreadBySession((prev) => ({ ...prev, [sessionId]: false }));
    } catch (e) {
      console.warn('mark_unread_for_session failed', e);
    }
    setSelectedSessionId(sessionId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSessionId(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatSessionDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background content-safe">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-12">
            <Icon name="Loader" className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading player profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background content-safe">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-12">
            <Icon name="AlertCircle" className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background content-safe">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Player not found.</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="mt-4">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(player.default_currency);

  return (
    <div ref={swipeBackRef} className="min-h-screen bg-gray-50 dark:bg-background content-safe">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="ghost"
            className="mb-4 text-poker-feltGreen dark:text-primary hover:text-poker-feltGreen/80 dark:hover:text-primary/80"
          >
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="relative flex flex-col items-center gap-2">
            <div className="cursor-pointer" onClick={() => setBackCardOpen(true)}>
              <Avatar className="h-16 w-16">
                <AvatarImage src={player.profile_picture || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(player.full_name || player.username || 'Player')}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                {player.full_name || player.username}
              </h1>
              <p className="text-gray-500 dark:text-muted-foreground">@{player.username}</p>
              {player.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{player.bio}</p>
              )}
            </div>
            <div className="absolute right-0 top-0">
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconMenuButton aria-label="More options">
                      <Icon name="EllipsisVertical" className="h-5 w-5" />
                    </IconMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Icon name="UserMinus" className="mr-2 h-4 w-4" />
                        Disconnect
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove your connection. You can reconnect later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeStudent(playerId!)}
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </header>

        {/* Session Stats */}
        <StudentSessionStats studentId={playerId!} />

        {/* Shared Sessions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-poker-gold">
              <Icon name="Share2" size={18} />
              <span>Shared Sessions</span>
              <Badge variant="secondary">{sharedSessions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sharedSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Inbox" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No sessions have been shared yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedSessions.map((session) => {
                  const profit = (session.cash_out || 0) - session.buy_in;
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors cursor-pointer"
                      onClick={() => handleSessionClick(session.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{session.game_type}</span>
                          <Badge variant="outline" className="text-xs">
                            {session.format}
                          </Badge>
                          {session.is_active && (
                            <Badge variant="default" className="text-xs">
                              Live
                            </Badge>
                          )}
                          {unreadBySession[session.id] && (
                            <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-destructive" aria-label="Unread activity" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>{formatSessionDateTime(session.start_time)}</span>
                          {session.location && <span> • {session.location}</span>}
                          {session.tables_played > 0 && <span> • {session.tables_played} tables</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">
                          Buy-in: {currencySymbol}{session.buy_in.toFixed(0)}
                        </div>
                        {!session.is_active && session.cash_out !== undefined && (
                          <ProfitLossBadge 
                            profit={profit} 
                            currency={session.currency || player.default_currency}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-poker-gold">
                <Icon name="TrendingUp" size={18} />
                <span>Performance Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {currencySymbol}{summary.averageBuyIn.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-muted-foreground">Average Buy-in</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {summary.totalProfit >= 0 ? '+' : ''}{currencySymbol}{summary.totalProfit.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-muted-foreground">Total P&L</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {summary.sessionFrequency}{summary.sessionFrequencyUnit === 'wk' ? '/wk' : '/mo'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-muted-foreground">Session Frequency</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {summary.bestSharedResult >= 0 ? '+' : ''}{currencySymbol}{summary.bestSharedResult.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-muted-foreground">Best Shared Result</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {summary.winRate}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-muted-foreground">Win Rate</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-poker-gold">
                    {summary.mostPlayedFormat}
                  </div>
                  <div className="text-xs text-foreground">Favorite Format</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Goals & Tasks */}
        <PlayerGoalsTasks studentId={playerId!} mode="coach" />

        {/* Shared Session Modal */}
        {selectedSessionId && (
          <SharedSessionModal
            isOpen={isModalOpen}
            onClose={closeModal}
            sessionId={selectedSessionId}
            playerId={playerId!}
          />
        )}
      </div>

      {playerId && (
        <ViewOnlyCardBack
          userId={playerId}
          open={backCardOpen}
          onOpenChange={setBackCardOpen}
        />
      )}
    </div>
  );
};

export default PlayerProfile;