import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/Lucide';
import { useToast } from '@/hooks/use-toast';

export type PlayerGoal = {
  id: string;
  coach_id: string;
  student_id: string;
  title: string;
  details?: string | null;
  due_date?: string | null; // ISO date (yyyy-MM-dd)
  color?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | string;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
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

const titleColorClass = (c?: string | null): string => {
  switch ((c || 'yellow').toLowerCase()) {
    case 'red':
      return 'text-poker-red';
    case 'orange':
      return 'text-poker-orange';
    case 'green':
      return 'text-poker-green';
    case 'purple':
      return 'text-poker-purple';
    case 'yellow':
    default:
      return 'text-primary';
  }
};

const colorDotBgClass = (c?: string | null): string => {
  switch ((c || 'yellow').toLowerCase()) {
    case 'red':
      return 'bg-poker-red';
    case 'orange':
      return 'bg-poker-orange';
    case 'green':
      return 'bg-poker-green';
    case 'purple':
      return 'bg-poker-purple';
    case 'yellow':
    default:
      return 'bg-primary';
  }
};

export default function PlayerGoalsTasks({ studentId, mode }: PlayerGoalsTasksProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<PlayerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  // New goal form (coach only)
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [color, setColor] = useState<'red' | 'yellow' | 'orange' | 'green' | 'purple'>('yellow');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isCoach = mode === 'coach';
  const sectionTitle = 'Key Focus Points';

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
      // Upload image if provided
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filePath = `player_goals_images/${user.id}/${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('tutorial_images')
          .upload(filePath, imageFile, { upsert: true, contentType: imageFile.type });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('tutorial_images').getPublicUrl(filePath);
        imageUrl = data.publicUrl || null;
      }

      const payload = {
        coach_id: user.id,
        student_id: studentId,
        title: title.trim(),
        details: details.trim() || null,
        status: 'pending',
        color,
        image_url: imageUrl,
      } as const;
      const { error } = await supabase.from('player_goals').insert(payload);
      if (error) throw error;
      setTitle("");
      setDetails("");
      setColor('yellow');
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadGoals(false);
    } catch (e: any) {
      console.error('Failed to add goal', e);
      toast({ title: 'Upload failed', description: e?.message || 'Could not add goal.', variant: 'destructive' });
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
                  <div className="md:col-span-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (imagePreview) URL.revokeObjectURL(imagePreview);
                        setImageFile(f);
                        setImagePreview(f ? URL.createObjectURL(f) : null);
                      }}
                      className="sr-only"
                      aria-label="Attach Picture"
                    />
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Attach Picture
                      </Button>
                      {imagePreview && (
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 overflow-hidden rounded-sm border">
                            <img src={imagePreview} alt="Selected image preview" className="h-full w-full object-cover" />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              if (imagePreview) URL.revokeObjectURL(imagePreview);
                              setImagePreview(null);
                              setImageFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            aria-label="Remove attached image"
                          >
                            <span aria-hidden>×</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Select value={color} onValueChange={(v) => setColor(v as 'red' | 'yellow' | 'orange' | 'green' | 'purple')}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${colorDotBgClass(color)}`} />
                          <SelectValue placeholder="Select color" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="red">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-poker-red" />
                            <span>Red</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="yellow">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                            <span>Yellow</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="orange">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-poker-orange" />
                            <span>Orange</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="green">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-poker-green" />
                            <span>Green</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="purple">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-poker-purple" />
                            <span>Purple</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button onClick={addGoal} disabled={adding || !title.trim()}>
                      <Icon name="Plus" className="mr-2 h-4 w-4" />
                      Add
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
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${colorDotBgClass(g.color)}`} />
                          <span className={`font-semibold text-base ${titleColorClass(g.color)}`}>{toTitleCase(g.title)}</span>
                          {g.image_url && (
                            <a href={g.image_url} target="_blank" rel="noopener noreferrer" aria-label="View attached image">
                              <Icon name="Image" className="h-4 w-4" />
                            </a>
                          )}
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
