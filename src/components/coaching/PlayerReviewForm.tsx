
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';

interface PlayerReviewFormProps {
  coachId: string;
  coachName: string;
}

interface SessionOption {
  id: string;
  startTime: string;
  sessionType?: string;
}

const PlayerReviewForm = ({ coachId, coachName }: PlayerReviewFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      sessionId: 'none',
      reviewType: '',
      message: '',
    },
  });

  // Load user's sessions when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      loadUserSessions();
    }
  }, [open, user?.id]);

  const loadUserSessions = async () => {
    if (!user?.id) return;
    
    try {
      const { data: userSessions, error } = await supabase
        .from('sessions')
        .select('id, start_time, session_type')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading sessions:', error);
        return;
      }

      const sessionOptions: SessionOption[] = userSessions?.map(session => ({
        id: session.id,
        startTime: session.start_time,
        sessionType: session.session_type,
      })) || [];

      setSessions(sessionOptions);
    } catch (error) {
      console.error('Error in loadUserSessions:', error);
    }
  };

  const onSubmit = async (data: any) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to send a review.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('player_to_coach_reviews')
        .insert({
          player_id: user.id,
          coach_id: coachId,
          session_id: data.sessionId === 'none' ? null : data.sessionId,
          review_type: data.reviewType,
          message: data.message,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Review Sent",
        description: `Your review has been sent to ${coachName}.`
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error sending review:', error);
      toast({
        title: "Error",
        description: "Failed to send review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Icon name="MessageSquare" size={16} className="mr-2" />
          Leave Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Review to {coachName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sessionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a session (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No specific session</SelectItem>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {new Date(session.startTime).toLocaleDateString()} - {session.sessionType || 'Session'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reviewType"
              rules={{ required: "Please select a review type" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select review type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Question">Question</SelectItem>
                      <SelectItem value="Suggestion">Suggestion</SelectItem>
                      <SelectItem value="General Review">General Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              rules={{ required: "Please enter your message" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your review message..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Review'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerReviewForm;
