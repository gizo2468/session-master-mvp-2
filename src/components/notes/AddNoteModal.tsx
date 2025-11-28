import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteSaved: () => void;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  open,
  onOpenChange,
  onNoteSaved,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [opponentName, setOpponentName] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save notes.',
        variant: 'destructive',
      });
      return;
    }

    if (!opponentName.trim() || !noteBody.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both opponent name and note.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase.from('player_notes').insert({
        user_id: user.id,
        opponent_name: opponentName.trim(),
        note_body: noteBody.trim(),
      });

      if (error) throw error;

      toast({
        title: 'Note saved',
        description: 'Your note has been saved successfully.',
      });

      // Reset form and close
      setOpponentName('');
      setNoteBody('');
      onNoteSaved();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setOpponentName('');
      setNoteBody('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="opponent-name">Opponent Name</Label>
            <Input
              id="opponent-name"
              placeholder="Enter opponent name..."
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-body">Note</Label>
            <Textarea
              id="note-body"
              placeholder="Write your note about this opponent..."
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={4}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
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
            Save Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteModal;
