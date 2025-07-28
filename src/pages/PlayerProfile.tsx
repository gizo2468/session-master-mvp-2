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

      // Load player profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, profile_picture, email, bio, default_currency')
        .eq('id', playerId)
        .single();

      if (profileError) {
        console.error('Error loading player profile:', profileError);
        setError('Failed to load player profile.');
        return;
      }

      setPlayer({
        ...profileData,
        default_currency: profileData.default_currency || 'USD'
      });

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
        mostPlayedFormat: 'N/A'
      });
      return;
    }

    const completedSessions = sessions.filter(s => !s.is_active && s.end_time);
    
    const totalProfit = completedSessions.reduce((sum, session) => {
      const profit = (session.cash_out || 0) - session.buy_in;
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
      ? Math.round((completedSessions.filter(s => (s.cash_out || 0) > s.buy_in).length / completedSessions.length) * 100)
      : 0;

    // Find most played format
    const formatCounts = sessions.reduce((acc, session) => {
      acc[session.format] = (acc[session.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostPlayedFormat = Object.keys(formatCounts).length > 0 
      ? Object.entries(formatCounts).sort(([,a], [,b]) => b - a)[0][0]
      : 'N/A';

    setSummary({
      totalSharedSessions: sessions.length,
      totalProfit,
      averageSessionLength,
      totalHours,
      winRate,
      mostPlayedFormat
    });
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
      <div className="min-h-screen bg-gray-50">
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
      <div className="min-h-screen bg-gray-50">
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
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="ghost"
            className="mb-4 text-poker-feltGreen hover:text-poker-feltGreen/80"
          >
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={player.profile_picture || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials(player.full_name || player.username || 'Player')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-poker-black">
                {player.full_name || player.username}
              </h1>
              <p className="text-gray-500">@{player.username}</p>
              {player.bio && (
                <p className="text-sm text-gray-600 mt-1">{player.bio}</p>
              )}
            </div>
          </div>
        </header>

        {/* Session Stats */}
        <StudentSessionStats studentId={playerId!} />

        {/* Shared Sessions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                      className="flex items-center justify-between p-4 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors"
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
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingUp" size={18} />
                <span>Performance Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-poker-feltGreen">
                    {summary.totalSharedSessions}
                  </div>
                  <div className="text-xs text-gray-500">Shared Sessions</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.totalProfit >= 0 ? '+' : ''}{currencySymbol}{summary.totalProfit.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500">Total P&L</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-poker-feltGreen">
                    {summary.totalHours}h
                  </div>
                  <div className="text-xs text-gray-500">Total Hours</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-poker-feltGreen">
                    {summary.averageSessionLength}m
                  </div>
                  <div className="text-xs text-gray-500">Avg Length</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${summary.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.winRate}%
                  </div>
                  <div className="text-xs text-gray-500">Win Rate</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-poker-feltGreen">
                    {summary.mostPlayedFormat}
                  </div>
                  <div className="text-xs text-gray-500">Favorite Format</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlayerProfile;