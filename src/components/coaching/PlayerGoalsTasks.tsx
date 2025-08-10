import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/Lucide';
import { format } from 'date-fns';

export type PlayerGoal = {
  id: string;
  coach_id: string;
  student_id: string;
  title: string;
  details?: string | null;
  due_date?: string | null; // ISO date (yyyy-MM-dd)
  status: 'pending' | 'in_progress' | 'completed' | string;
  created_at: string;
  updated_at: string;
};

interface PlayerGoalsTasksProps {
  studentId: string;
  mode: 'coach' | 'player';
}

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function PlayerGoalsTasks({ studentId, mode }: PlayerGoalsTasksProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<PlayerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // New goal form (coach only)
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const isCoach = mode === 'coach';
  const sectionTitle = isCoach ? 'Player Goals & Tasks' : 'Your Goals & Tasks';

  const filters = useMemo(() => ({
    student_id: studentId,
    coach_id: isCoach ? user?.id : undefined,
  }), [studentId, isCoach, user?.id]);

  useEffect(() => {
    if (!user?.id || !studentId) return;
    loadGoals();

    // Realtime subscription
    const channel = supabase
      .channel(`player-goals-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_goals' }, (payload) => {
        const row: any = payload.new || payload.old;
        if (!row) return;
        if (row.student_id !== studentId) return;
        if (isCoach && row.coach_id !== user.id) return;
        // For simplicity refresh list
        loadGoals(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, user?.id, isCoach]);

  const loadGoals = async (setIsLoading: boolean = true) => {
    if (!user?.id) return;
    if (setIsLoading) setLoading(true);
    try {
      let query = supabase.from('player_goals').select('*').eq('student_id', filters.student_id);
      if (filters.coach_id) query = query.eq('coach_id', filters.coach_id);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setGoals((data || []) as PlayerGoal[]);
    } catch (e) {
      console.error('Failed to load goals', e);
    } finally {
      if (setIsLoading) setLoading(false);
    }
  };

  const addGoal = async () => {
    if (!user?.id || !title.trim()) return;
    setAdding(true);
    try {
      const payload = {
        coach_id: user.id,
        student_id: studentId,
        title: title.trim(),
        details: details.trim() || null,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        status: 'pending',
      };
      const { error } = await supabase.from('player_goals').insert(payload);
      if (error) throw error;
      setTitle('');
      setDetails('');
      setDueDate(undefined);
      await loadGoals(false);
    } catch (e) {
      console.error('Failed to add goal', e);
    } finally {
      setAdding(false);
    }
  };

  const updateStatus = async (id: string, status: PlayerGoal['status']) => {
    try {
      const { error } = await supabase.from('player_goals').update({ status }).eq('id', id);
      if (error) throw error;
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="CheckSquare" size={18} />
          <span>{sectionTitle}</span>
          <Badge variant="secondary">{goals.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-muted-foreground">
            <Icon name="Loader" className="mx-auto mb-2 h-6 w-6 animate-spin" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isCoach && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Title (short description)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Textarea
                      placeholder="Details / Notes (optional)"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    />
                  </div>
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal">
                          <Icon name="Calendar" className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, 'PPP') : 'Due date (optional)'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button onClick={addGoal} disabled={adding || !title.trim()}>
                      <Icon name="Plus" className="mr-2 h-4 w-4" />
                      Add Goal
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {goals.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Icon name="Inbox" className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">No goals yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {goals.map((g) => (
                  <div key={g.id} className="flex items-start justify-between p-4 rounded-lg border bg-card/30">
                    <div className="pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{g.title}</span>
                        <Badge variant={g.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                          {statusLabel[g.status] || g.status}
                        </Badge>
                        {g.due_date && (
                          <Badge variant="secondary" className="text-xs">
                            Due {format(new Date(g.due_date), 'PP')}
                          </Badge>
                        )}
                      </div>
                      {g.details && (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{g.details}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {mode === 'player' && g.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(g.id, 'completed')}>Mark Completed</Button>
                      )}
                      {isCoach && (
                        <>
                          {g.status !== 'pending' && (
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(g.id, 'pending')}>Set Pending</Button>
                          )}
                          {g.status !== 'in_progress' && (
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(g.id, 'in_progress')}>In Progress</Button>
                          )}
                          {g.status !== 'completed' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(g.id, 'completed')}>Complete</Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
