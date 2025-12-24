
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';

interface Session {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  game_type?: string;
  session_type?: string;
  notes?: string;
  created_at: string;
}

interface SessionStats {
  sessionId: string;
  handsCount: number;
  tablesCount: number;
  netProfit?: number;
  totalBuyIn?: number;
}

export const EnhancedStudentSessions = ({ studentId }: { studentId: string }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'duration'>('date');
  const [filterType, setFilterType] = useState<'all' | 'profitable' | 'unprofitable'>('all');
  
  useEffect(() => {
    loadStudentSessions();
  }, [studentId]);

  const loadStudentSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Loading enhanced sessions for student
      
      // Load sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', studentId)
        .order('start_time', { ascending: false });

      if (sessionsError) {
        console.error('Error loading student sessions:', sessionsError);
        setError('Failed to load sessions');
        return;
      }

      // Sessions loaded successfully
      setSessions(sessionsData || []);

      // Load session statistics
      if (sessionsData && sessionsData.length > 0) {
        await loadSessionStats(sessionsData.map(s => s.id));
      }
      
    } catch (error) {
      console.error('Error in loadStudentSessions:', error);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStats = async (sessionIds: string[]) => {
    try {
      // Load hands count for each session
      const { data: handsData, error: handsError } = await supabase
        .from('session_hands')
        .select('session_id')
        .in('session_id', sessionIds);

      // Load tables count for each session
      const { data: tablesData, error: tablesError } = await supabase
        .from('session_tables')
        .select('session_id')
        .in('session_id', sessionIds);

      // Load session results for profit data
      const { data: resultsData, error: resultsError } = await supabase
        .from('session_results')
        .select('session_id, net_profit, total_buy_in')
        .in('session_id', sessionIds);

      if (handsError || tablesError || resultsError) {
        console.error('Error loading session stats:', { handsError, tablesError, resultsError });
        return;
      }

      // Aggregate the statistics
      const stats: SessionStats[] = sessionIds.map(sessionId => {
        const handsCount = handsData?.filter(h => h.session_id === sessionId).length || 0;
        const tablesCount = tablesData?.filter(t => t.session_id === sessionId).length || 0;
        const result = resultsData?.find(r => r.session_id === sessionId);

        return {
          sessionId,
          handsCount,
          tablesCount,
          netProfit: result?.net_profit || undefined,
          totalBuyIn: result?.total_buy_in || undefined,
        };
      });

      setSessionStats(stats);
    } catch (error) {
      console.error('Error in loadSessionStats:', error);
    }
  };

  const getSessionStats = (sessionId: string) => {
    return sessionStats.find(s => s.sessionId === sessionId) || {
      sessionId,
      handsCount: 0,
      tablesCount: 0,
    };
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    return diffInMinutes;
  };

  const formatGameType = (gameType?: string, sessionType?: string) => {
    const type = gameType || 'Poker';
    const format = sessionType || 'Session';
    return `${type} ${format}`;
  };

  const filteredAndSortedSessions = () => {
    let filtered = sessions.filter(session => {
      const matchesSearch = !searchTerm || 
        formatGameType(session.game_type, session.session_type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.notes && session.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (filterType === 'all') return matchesSearch;
      
      const stats = getSessionStats(session.id);
      if (filterType === 'profitable') {
        return matchesSearch && stats.netProfit !== undefined && stats.netProfit > 0;
      }
      if (filterType === 'unprofitable') {
        return matchesSearch && stats.netProfit !== undefined && stats.netProfit < 0;
      }
      
      return matchesSearch;
    });

    // Sort sessions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
        case 'profit':
          const aStats = getSessionStats(a.id);
          const bStats = getSessionStats(b.id);
          return (bStats.netProfit || 0) - (aStats.netProfit || 0);
        case 'duration':
          const aDuration = calculateDuration(a.start_time, a.end_time);
          const bDuration = calculateDuration(b.start_time, b.end_time);
          return bDuration - aDuration;
        default:
          return 0;
      }
    });

    return filtered;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <Icon name="Loader" className="mx-auto mb-2 h-8 w-8 animate-spin" />
            <p>Loading sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            <Icon name="AlertCircle" className="mx-auto mb-2 h-8 w-8" />
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={loadStudentSessions}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <Icon name="Clock" className="mx-auto mb-2 h-8 w-8" />
            <p>This student hasn't recorded any sessions yet.</p>
            <p className="text-sm mt-1">Sessions will appear here once the student starts tracking their poker sessions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredSessions = filteredAndSortedSessions();
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Filter" size={20} />
            <span>Session Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <Icon name="Search" className="absolute left-2 top-2.5 text-gray-400" size={16} />
            </div>
            
            <Select value={sortBy} onValueChange={(value: 'date' | 'profit' | 'duration') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest First)</SelectItem>
                <SelectItem value="profit">Profit/Loss</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(value: 'all' | 'profitable' | 'unprofitable') => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by result..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="profitable">Profitable</SelectItem>
                <SelectItem value="unprofitable">Unprofitable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredSessions.map(session => {
        const duration = calculateDuration(session.start_time, session.end_time);
        const gameTypeDisplay = formatGameType(session.game_type, session.session_type);
        const stats = getSessionStats(session.id);
        
        return (
          <Card key={session.id}>
            <CardContent className="p-4">
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium flex items-center gap-2">
                      {gameTypeDisplay}
                      {new Date(session.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                          Recent
                        </Badge>
                      )}
                    </div>
                    {stats.netProfit !== undefined && (
                      <div className={`text-sm font-medium ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-2">
                    {duration} minutes • {new Date(session.start_time).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Icon name="Cards" size={12} />
                      <span>{stats.handsCount} hands</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Grid" size={12} />
                      <span>{stats.tablesCount} tables</span>
                    </div>
                    {stats.totalBuyIn !== undefined && (
                      <div className="flex items-center gap-1">
                        <Icon name="DollarSign" size={12} />
                        <span>${stats.totalBuyIn.toFixed(2)} buy-in</span>
                      </div>
                    )}
                  </div>
                  
                  {session.notes && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {session.notes}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-auto pt-2">
                  <div className="text-sm text-gray-500">
                    Session {session.id.slice(0, 8)}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/coach/student/${studentId}/session/${session.id}`)}
                    className="flex items-center gap-1 min-w-[90px] justify-center"
                  >
                    <Icon name="MessageSquare" size={14} />
                    <span>Review</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {filteredSessions.length === 0 && sessions.length > 0 && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-gray-500">
              <Icon name="Search" className="mx-auto mb-2 h-8 w-8" />
              <p>No sessions match your current filters.</p>
              <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {filteredSessions.length > 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Showing {filteredSessions.length} of {sessions.length} sessions
          </p>
        </div>
      )}
    </div>
  );
};
