
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface TableReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  tableId: string;
  studentId: string;
  onSuccess: () => void;
}

export const TableReviewForm: React.FC<TableReviewFormProps> = ({
  open,
  onOpenChange,
  sessionId,
  tableId,
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
        .from('coach_to_table_reviews')
        .insert({
          coach_id: user.id,
          student_id: studentId,
          session_id: sessionId,
          table_id: tableId,
          message: message.trim()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Review submitted",
        description: "Your table review has been saved successfully"
      });

      setMessage('');
      onSuccess();
    } catch (error) {
      console.error('Error submitting table review:', error);
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
          <DialogTitle>Review Table</DialogTitle>
          <DialogDescription>
            Leave feedback on this table's play and performance.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">Review Comments</Label>
            <Textarea
              id="message"
              placeholder="Share your thoughts on this table's strategy, decisions, or performance..."
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
