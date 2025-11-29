import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Pencil, User, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface PlayerNote {
  id: string;
  opponent_name: string;
  note_body: string;
  opponent_image?: string;
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
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setNoteBody(note.note_body);
      setIsEditing(false);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [note]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('opponent-avatars')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('opponent-avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

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

      // Upload new image if changed
      let imageUrl = note.opponent_image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('player_notes')
        .update({ 
          note_body: noteBody.trim(),
          opponent_image: imageUrl 
        })
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

  const handleCancelEdit = () => {
    if (note) {
      setNoteBody(note.note_body);
      setImageFile(null);
      setImagePreview(null);
    }
    setIsEditing(false);
  };

  // Get the current display image (preview takes priority over saved)
  const displayImage = imagePreview || note?.opponent_image;

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{note.opponent_name}</DialogTitle>
        </DialogHeader>

        {/* Profile Header */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {isEditing ? (
            // Editable avatar in edit mode
            <div 
              className="relative w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all duration-200 cursor-pointer group bg-muted flex items-center justify-center overflow-hidden"
              onClick={() => document.getElementById('edit-avatar-upload')?.click()}
            >
              {displayImage ? (
                <>
                  <img 
                    src={displayImage} 
                    alt="Opponent avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </>
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              )}
            </div>
          ) : (
            // View-only avatar
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {note.opponent_image ? (
                <img 
                  src={note.opponent_image} 
                  alt="Opponent avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          )}
          <input
            id="edit-avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <h2 className="text-lg font-semibold">{note.opponent_name}</h2>
          <span className="text-sm text-muted-foreground">
            {format(new Date(note.created_at), 'MMMM d, yyyy')}
          </span>
        </div>

        {/* Note Content */}
        <div className="py-4">
          {isEditing ? (
            <Textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={6}
              disabled={isSaving}
              className="resize-none"
            />
          ) : (
            <div className="bg-muted/30 rounded-lg p-4 min-h-[120px]">
              <p className="text-sm whitespace-pre-wrap">{note.note_body}</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
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
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEditNoteModal;
