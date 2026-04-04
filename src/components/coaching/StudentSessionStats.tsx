
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';

interface SessionStats {
  totalSessions: number;
  totalHours: number;
  lastSessionDate: string | null;
  averageSessionLength: number;
  mostPlayedGameType: string | null;
}

export const StudentSessionStats = ({ studentId }: { studentId: string }) => {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionStats();
  }, [studentId]);

  const loadSessionStats = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Loading session stats for student:', studentId);
      
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', studentId)
        // Only include finished sessions (exclude live/ongoing)
        .or('is_active.eq.false,status.eq.completed,current_status.eq.ended');

      if (error) {
        console.error('❌ Error loading session stats:', error);
        return;
      }

      // Keep only finished sessions with a valid end_time
      const finishedSessions = (sessions || []).filter((s: any) =>
        (s.is_active === false || s.status === 'completed' || s.current_status === 'ended') && !!s.end_time
      );

      if (finishedSessions.length === 0) {
        setStats({
          totalSessions: 0,
          totalHours: 0,
          lastSessionDate: null,
          averageSessionLength: 0,
          mostPlayedGameType: null
        });
        return;
      }

      // Calculate statistics from finished sessions only
      const totalSessions = finishedSessions.length;

      const totalMinutes = finishedSessions.reduce((sum: number, session: any) => {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        const duration = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
        return sum + (isFinite(duration) ? duration : 0);
      }, 0);

      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      const averageSessionLength = Math.round(totalMinutes / totalSessions);

      const lastSession = finishedSessions
        .slice()
        .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];

      // Find most played game type
      const gameTypeCounts = finishedSessions.reduce((acc: Record<string, number>, session: any) => {
        const gameType = session.game_type || 'Unknown';
        acc[gameType] = (acc[gameType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostPlayedGameType = Object.keys(gameTypeCounts).length > 0
        ? Object.entries(gameTypeCounts).sort(([, a], [, b]) => b - a)[0][0]
        : null;

      setStats({
        totalSessions,
        totalHours,
        lastSessionDate: lastSession ? lastSession.start_time : null,
        averageSessionLength,
        mostPlayedGameType
      });
      
    } catch (error) {
      console.error('❌ Error in loadSessionStats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500 dark:text-muted-foreground">
            <Icon name="Loader" className="mx-auto mb-2 h-6 w-6 animate-spin" />
            <p className="text-sm">Loading stats...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="BarChart3" size={18} />
          <span>Session Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalSessions}</div>
            <div className="text-xs text-gray-500 dark:text-muted-foreground">Total Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalHours}h</div>
            <div className="text-xs text-gray-500 dark:text-muted-foreground">Total Hours</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.averageSessionLength}m</div>
            <div className="text-xs text-gray-500 dark:text-muted-foreground">Avg Length</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-poker-feltGreen">
              {stats.mostPlayedGameType || 'N/A'}
            </div>
            <div className="text-xs text-gray-500 dark:text-muted-foreground">Most Played</div>
          </div>
        </div>
        
        {stats.lastSessionDate && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
              <Icon name="Clock" size={14} />
              <span>Last session: {new Date(stats.lastSessionDate).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
