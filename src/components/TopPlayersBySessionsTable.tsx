
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface PlayerSessionSummary {
  user_id: string;
  full_name: string;
  session_count: number;
  total_minutes_played: number;
  total_hours_played: number;
}

const TopPlayersBySessionsTable: React.FC = () => {
  const [playerData, setPlayerData] = useState<PlayerSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query sessions and profiles separately since the view doesn't exist
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select(`
            user_id,
            start_time,
            end_time
          `);

        if (sessionsError) throw sessionsError;

        // Get unique user IDs
        const userIds = [...new Set(sessionsData?.map(session => session.user_id) || [])];

        // Fetch profiles and private data for these users
        const [profilesResult, privateResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds),
          supabase
            .from('user_private_data')
            .select('id, full_name')
            .in('id', userIds)
        ]);

        if (profilesResult.error) throw profilesResult.error;

        const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
        const privateMap = new Map(privateResult.data?.map(p => [p.id, p]) || []);

        // Calculate session statistics for each user
        const playerStats: PlayerSessionSummary[] = [];
        
        userIds.forEach(userId => {
          const userSessions = sessionsData?.filter(session => session.user_id === userId) || [];
          const userProfile = profileMap.get(userId);
          const privateInfo = privateMap.get(userId);
          
          if (userSessions.length > 0) {
            const totalMinutes = userSessions.reduce((total, session) => {
              if (session.start_time && session.end_time) {
                const startTime = new Date(session.start_time);
                const endTime = new Date(session.end_time);
                const diffMs = endTime.getTime() - startTime.getTime();
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return total + diffMinutes;
              }
              return total;
            }, 0);

            playerStats.push({
              user_id: userId,
              full_name: privateInfo?.full_name || userProfile?.username || 'Unknown Player',
              session_count: userSessions.length,
              total_minutes_played: totalMinutes,
              total_hours_played: Math.round((totalMinutes / 60) * 10) / 10
            });
          }
        });

        // Sort by session count descending
        const sortedPlayers = playerStats
          .sort((a, b) => b.session_count - a.session_count)
          .slice(0, 10); // Top 10 players

        setPlayerData(sortedPlayers);
      } catch (err) {
        console.error('Error fetching top players:', err);
        setError('Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    fetchTopPlayers();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Players by Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Players by Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Players by Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Hours Played</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playerData.map((player) => (
              <TableRow key={player.user_id}>
                <TableCell className="font-medium">{player.full_name}</TableCell>
                <TableCell className="text-right">{player.session_count}</TableCell>
                <TableCell className="text-right">{player.total_hours_played}h</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {playerData.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No session data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TopPlayersBySessionsTable;
