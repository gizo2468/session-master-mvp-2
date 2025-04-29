
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';

interface PlayerSessionSummary {
  full_name: string;
  user_id: string;
  session_count: number;
}

export default function TopPlayersBySessionsTable() {
  const [playerStats, setPlayerStats] = useState<PlayerSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('session_summary_by_user')
          .select('*')
          .order('session_count', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setPlayerStats(data || []);
      } catch (err) {
        console.error('Error fetching top players:', err);
        setError('Failed to load player statistics');
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
          <div className="flex justify-center items-center p-6">
            <p>Loading player statistics...</p>
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
          <div className="p-4 text-center">
            <p className="text-red-500">{error}</p>
          </div>
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
        {playerStats.length === 0 ? (
          <div className="text-center p-4">
            <p>No session data available yet</p>
          </div>
        ) : (
          <Table>
            <TableCaption>Players ranked by number of completed sessions</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Full Name</TableHead>
                <TableHead>Number of Sessions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStats.map((player) => (
                <TableRow key={player.user_id}>
                  <TableCell className="font-medium">{player.full_name}</TableCell>
                  <TableCell>{player.session_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
