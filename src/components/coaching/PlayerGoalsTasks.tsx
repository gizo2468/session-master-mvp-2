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
import { useToast } from '@/hooks/use-toast';

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

const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export default function PlayerGoalsTasks({ studentId, mode }: PlayerGoalsTasksProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<PlayerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  // New goal form (coach only)
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const isCoach = mode === 'coach';
  const sectionTitle = isCoach ? 'Player Goals & Tasks' : 'Key Focus Points';

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

  const handleDelete = async (id: string) => {
    if (!isCoach) return;
    if (!window.confirm("Delete this item?")) return;
    try {
      const { error } = await supabase.from('player_goals').delete().eq('id', id);
      if (error) throw error;
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (e: any) {
      console.error('Failed to delete goal', e);
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete item.', variant: 'destructive' });
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
                   <div key={g.id} className={isCoach ? "flex items-start justify-between p-4 rounded-lg border bg-card/30" : "p-4 rounded-lg border bg-card/30"}>
                     <div className={isCoach ? "pr-4" : ""}>
                       <div className="mb-1">
                         <span className="font-semibold text-base text-primary">{toTitleCase(g.title)}</span>
                       </div>
                       {g.details && (
                         <div className="text-sm text-muted-foreground whitespace-pre-wrap">{g.details}</div>
                       )}
                     </div>
                     {isCoach && (
                       <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(g.id)} aria-label="Delete item">
                         <Icon name="Trash2" className="h-4 w-4" />
                       </Button>
                     )}
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
