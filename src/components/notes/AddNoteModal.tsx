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
import { Save, Loader2, Camera, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PLAYER_COLORS, DEFAULT_COLOR, PlayerColorId } from './playerColors';

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<PlayerColorId>(DEFAULT_COLOR);

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
      
      // Upload image if selected
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase.from('player_notes').insert({
        user_id: user.id,
        opponent_name: opponentName.trim(),
        note_body: noteBody.trim(),
        opponent_image: imageUrl,
        color: selectedColor,
      });

      if (error) throw error;

      toast({
        title: 'Note saved',
        description: 'Your note has been saved successfully.',
      });

      // Reset form and close
      setOpponentName('');
      setNoteBody('');
      setImageFile(null);
      setImagePreview(null);
      setSelectedColor(DEFAULT_COLOR);
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
      setImageFile(null);
      setImagePreview(null);
      setSelectedColor(DEFAULT_COLOR);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-form-type="other">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>

        {/* Hidden decoy fields to trick Safari autofill detection - must be outside visible form */}
        <div style={{ position: 'absolute', top: -9999, left: -9999, height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
          <input type="text" name="fakeusernameremembered" tabIndex={-1} />
          <input type="password" name="fakepasswordremembered" tabIndex={-1} />
        </div>

        <form 
          autoComplete="off" 
          data-form-type="other" 
          role="presentation"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="space-y-4 py-2">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center gap-2">
              <div 
                className="relative w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all duration-200 cursor-pointer group bg-muted/20 hover:bg-muted/40 flex items-center justify-center overflow-hidden"
                onClick={() => document.getElementById('avatar-upload-add')?.click()}
              >
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="Opponent avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {imagePreview ? "Change Image" : "Add Profile Image"}
              </span>
              <input
                id="avatar-upload-add"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                autoComplete="off"
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
              />
            </div>

            <div className="space-y-2">
              <Label>Opponent Name / Online Nickname</Label>
              <Input
                placeholder="Enter player nickname..."
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                disabled={isSaving}
                type="text"
                autoComplete="new-password"
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
              />
            </div>

            {/* Player Color Tag */}
            <div className="space-y-2">
              <Label>Player Color Tag</Label>
              <div className="flex flex-wrap gap-2">
                {PLAYER_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.id)}
                    disabled={isSaving}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-150 ${
                      selectedColor === color.id 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ 
                      backgroundColor: color.hex,
                      border: color.border ? `2px solid ${color.border}` : '2px solid transparent'
                    }}
                    title={color.label}
                  >
                    {selectedColor === color.id && (
                      <Check 
                        className="h-4 w-4" 
                        style={{ color: ['white', 'yellow', 'neongreen', 'lightpink', 'lightblue'].includes(color.id) ? '#000' : '#fff' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                placeholder="Write your thoughts about this player..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={4}
                disabled={isSaving}
                autoComplete="new-password"
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Note
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteModal;