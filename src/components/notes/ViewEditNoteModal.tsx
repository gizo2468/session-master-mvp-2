import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PlayerNote {
  id: string;
  opponent_name: string;
  note_body: string;
  created_at: string;
  updated_at: string;
}

interface ViewEditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: PlayerNote | null;
  onNoteSaved: () => void;
}

const ViewEditNoteModal: React.FC<ViewEditNoteModalProps> = ({
  open,
  onOpenChange,
  note,
  onNoteSaved,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [noteBody, setNoteBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setNoteBody(note.note_body);
    }
  }, [note]);

  const handleSave = async () => {
    if (!user?.id || !note) {
      toast({
        title: 'Error',
        description: 'Unable to save note.',
        variant: 'destructive',
      });
      return;
    }

    if (!noteBody.trim()) {
      toast({
        title: 'Missing field',
        description: 'Note cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('player_notes')
        .update({ note_body: noteBody.trim() })
        .eq('id', note.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Note updated',
        description: 'Your note has been updated successfully.',
      });

      onNoteSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{note.opponent_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            {format(new Date(note.created_at), 'MMMM d, yyyy')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-body">Note</Label>
            <Textarea
              id="note-body"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={6}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEditNoteModal;
