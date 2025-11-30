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
import { Save, Loader2, Pencil, User, Camera, X, Check, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { SELECTABLE_COLORS, DEFAULT_COLOR, PlayerColorId, getColorById } from './playerColors';
import EditColorCategoriesModal from './EditColorCategoriesModal';
import { useColorLabels } from '@/hooks/useColorLabels';

interface PlayerNote {
  id: string;
  opponent_name: string;
  note_body: string;
  opponent_image?: string;
  color?: string;
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
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [editColorsOpen, setEditColorsOpen] = useState(false);
  const { getLabel } = useColorLabels();
  const [selectedColor, setSelectedColor] = useState<PlayerColorId>(DEFAULT_COLOR);

  useEffect(() => {
    if (note) {
      setNoteBody(note.note_body);
      setSelectedColor((note.color as PlayerColorId) || DEFAULT_COLOR);
      setIsEditing(false);
      setImageFile(null);
      setImagePreview(null);
      setIsImageFullscreen(false);
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
          opponent_image: imageUrl,
          color: selectedColor,
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
      setSelectedColor((note.color as PlayerColorId) || DEFAULT_COLOR);
      setImageFile(null);
      setImagePreview(null);
    }
    setIsEditing(false);
  };

  // Get the current display image (preview takes priority over saved)
  const displayImage = imagePreview || note?.opponent_image;
  const colorData = getColorById(note?.color);

  if (!note) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" data-form-type="other">
          <DialogHeader className="sr-only">
            <DialogTitle>{note.opponent_name}</DialogTitle>
          </DialogHeader>

          {/* Hidden decoy fields to trick Safari autofill detection */}
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
                // View-only avatar - clickable to enlarge if image exists
                <div 
                  className={`w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden ${
                    note.opponent_image ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200' : ''
                  }`}
                  onClick={() => note.opponent_image && setIsImageFullscreen(true)}
                >
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
                autoComplete="off"
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
              />
              
              {/* Opponent name with color indicator (View Mode only) */}
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <div 
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ 
                      backgroundColor: colorData.hex,
                      border: colorData.border ? `1px solid ${colorData.border}` : '1px solid transparent'
                    }}
                    title={colorData.label}
                  />
                )}
                <h2 className="text-lg font-semibold">{note.opponent_name}</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(note.created_at), 'MMMM d, yyyy')}
              </span>
            </div>

            {/* Color Selector (Edit Mode only) */}
            {isEditing && (
              <div className="space-y-2 mt-4">
                <Label>Player Color Tag</Label>
                <div className="relative flex flex-col gap-y-4 w-fit">
                  {/* Row 1: First 5 colors */}
                  <div className="flex gap-x-1">
                    {SELECTABLE_COLORS.slice(0, 5).map((color) => (
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
                        title={getLabel(color.id)}
                      >
                        {selectedColor === color.id && (
                          <Check 
                            className="h-4 w-4" 
                            style={{ color: ['yellow', 'neongreen', 'lightpink', 'lightblue'].includes(color.id) ? '#000' : '#fff' }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Row 2: Last 5 colors */}
                  <div className="flex gap-x-1">
                    {SELECTABLE_COLORS.slice(5, 10).map((color) => (
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
                        title={getLabel(color.id)}
                      >
                        {selectedColor === color.id && (
                          <Check 
                            className="h-4 w-4" 
                            style={{ color: ['yellow', 'neongreen', 'lightpink', 'lightblue'].includes(color.id) ? '#000' : '#fff' }}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Edit color categories button - positioned in the gap */}
                  <button
                    type="button"
                    onClick={() => setEditColorsOpen(true)}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors z-10"
                    title="Edit color categories"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}

            {/* Note Content */}
            <div className="py-4">
              {isEditing ? (
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={6}
                  disabled={isSaving}
                  className="resize-none"
                  autoComplete="new-password"
                  data-form-type="other"
                  data-1p-ignore="true"
                  data-lpignore="true"
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
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
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
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Viewer */}
      <Dialog open={isImageFullscreen} onOpenChange={setIsImageFullscreen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Opponent profile image</DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setIsImageFullscreen(false)}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
              aria-label="Close fullscreen image"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            
            {/* Enlarged image */}
            {note.opponent_image && (
              <img 
                src={note.opponent_image} 
                alt={`${note.opponent_name} profile`}
                className="max-w-full max-h-[85vh] rounded-lg object-contain animate-scale-in"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Color Categories Modal */}
      <EditColorCategoriesModal 
        open={editColorsOpen} 
        onOpenChange={setEditColorsOpen} 
      />
    </>
  );
};

export default ViewEditNoteModal;