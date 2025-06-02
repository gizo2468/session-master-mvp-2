
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface HandReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  handId: string;
  studentId: string;
  onSuccess: () => void;
}

export const HandReviewForm: React.FC<HandReviewFormProps> = ({
  open,
  onOpenChange,
  sessionId,
  handId,
  studentId,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user) {
      toast({
        title: "Error",
        description: "Please enter a review message",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('coach_to_hand_reviews')
        .insert({
          coach_id: user.id,
          student_id: studentId,
          session_id: sessionId,
          hand_id: handId,
          message: message.trim()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Review submitted",
        description: "Your hand review has been saved successfully"
      });

      setMessage('');
      onSuccess();
    } catch (error) {
      console.error('Error submitting hand review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Hand</DialogTitle>
          <DialogDescription>
            Leave feedback on this hand's play and decision-making.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">Hand Analysis</Label>
            <Textarea
              id="message"
              placeholder="Analyze the hand decisions, betting patterns, position play, or suggest improvements..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
