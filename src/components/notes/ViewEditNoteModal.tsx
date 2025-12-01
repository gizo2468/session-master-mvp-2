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
import { Save, Loader2, Pencil, User, Camera, X, Check, MoreHorizontal, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { SELECTABLE_COLORS, DEFAULT_COLOR, PlayerColorId, getColorById } from './playerColors';
import EditColorCategoriesModal from './EditColorCategoriesModal';
import { useColorLabels } from '@/hooks/useColorLabels';

interface OpponentProfile {
  id: string;
  nickname: string;
  image_url?: string | null;
  color?: string | null;
}

interface PlayerNote {
  id: string;
  note_body: string;
  created_at: string;
  updated_at: string;
  opponent_profile_id: string;
}

interface ViewEditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponentProfile: OpponentProfile | null;
  onNoteSaved: () => void;
}

const ViewEditNoteModal: React.FC<ViewEditNoteModalProps> = ({
  open,
  onOpenChange,
  opponentProfile,
  onNoteSaved,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [editColorsOpen, setEditColorsOpen] = useState(false);
  const { getLabel } = useColorLabels();
  const [selectedColor, setSelectedColor] = useState<PlayerColorId>(DEFAULT_COLOR);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<OpponentProfile | null>(null);

  // Fetch all notes for this opponent when modal opens
  useEffect(() => {
    if (open && opponentProfile?.id && user?.id) {
      fetchNotesForOpponent();
      setCurrentProfile(opponentProfile);
      setSelectedColor((opponentProfile.color as PlayerColorId) || DEFAULT_COLOR);
      setIsEditingProfile(false);
      setEditingNoteId(null);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [open, opponentProfile?.id, user?.id]);

  const fetchNotesForOpponent = async () => {
    if (!opponentProfile?.id || !user?.id) return;
    
    try {
      setIsLoadingNotes(true);
      const { data, error } = await supabase
        .from('player_notes')
        .select('id, note_body, created_at, updated_at, opponent_profile_id')
        .eq('opponent_profile_id', opponentProfile.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes for opponent:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

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

  const handleSaveProfile = async () => {
    if (!user?.id || !currentProfile) return;

    try {
      setIsSaving(true);

      // Upload new image if changed
      let imageUrl = currentProfile.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Update opponent profile
      const { error: profileError } = await supabase
        .from('opponent_profiles')
        .update({ 
          image_url: imageUrl,
          color: selectedColor,
        })
        .eq('id', currentProfile.id)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update local state
      setCurrentProfile({
        ...currentProfile,
        image_url: imageUrl,
        color: selectedColor,
      });

      toast({
        title: 'Profile updated',
        description: 'Opponent profile has been updated.',
      });

      setIsEditingProfile(false);
      setImageFile(null);
      setImagePreview(null);
      onNoteSaved();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNote = async (noteId: string) => {
    if (!user?.id || !editingNoteBody.trim()) {
      toast({
        title: 'Missing field',
        description: 'Note cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const { error: noteError } = await supabase
        .from('player_notes')
        .update({ note_body: editingNoteBody.trim() })
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (noteError) throw noteError;

      toast({
        title: 'Note updated',
        description: 'Your note has been updated.',
      });

      setEditingNoteId(null);
      setEditingNoteBody('');
      fetchNotesForOpponent();
      onNoteSaved();
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

  const handleDeleteNote = async (noteId: string) => {
    if (!user?.id) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('player_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Note deleted',
        description: 'Your note has been deleted.',
      });

      // If this was the last note, close the modal
      if (notes.length === 1) {
        onOpenChange(false);
      }

      fetchNotesForOpponent();
      onNoteSaved();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setSelectedColor((currentProfile?.color as PlayerColorId) || DEFAULT_COLOR);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleStartEditNote = (note: PlayerNote) => {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.note_body);
  };

  const handleCancelNoteEdit = () => {
    setEditingNoteId(null);
    setEditingNoteBody('');
  };

  // Get the current display image
  const displayImage = imagePreview || currentProfile?.image_url;
  const colorData = getColorById(currentProfile?.color);

  if (!opponentProfile) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto" data-form-type="other">
          <DialogHeader className="sr-only">
            <DialogTitle>{currentProfile?.nickname || 'Opponent'}</DialogTitle>
          </DialogHeader>

          <form
            autoComplete="off" 
            data-form-type="other"
            data-credential="false"
            role="presentation"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-3 pt-2">
              {isEditingProfile ? (
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
                    currentProfile?.image_url ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200' : ''
                  }`}
                  onClick={() => currentProfile?.image_url && setIsImageFullscreen(true)}
                >
                  {currentProfile?.image_url ? (
                    <img 
                      src={currentProfile.image_url} 
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
                data-bwignore="true"
                data-protonpass-ignore="true"
              />
              
              {/* Opponent name with color indicator (View Mode only) */}
              <div className="flex items-center gap-2">
                {!isEditingProfile && (
                  <div 
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ 
                      backgroundColor: colorData.hex,
                      border: colorData.border ? `1px solid ${colorData.border}` : '1px solid transparent'
                    }}
                    title={colorData.label}
                  />
                )}
                <h2 className="text-lg font-semibold">{currentProfile?.nickname || 'Unknown'}</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>

            {/* Color Selector (Profile Edit Mode only) */}
            {isEditingProfile && (
              <div className="space-y-2 mt-4">
                <Label>Player Color Tag</Label>
                <div className="flex items-center gap-x-3">
                  {/* Color rows container */}
                  <div className="flex flex-col gap-y-1">
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
                  </div>
                  
                  {/* Edit color categories button */}
                  <button
                    type="button"
                    onClick={() => setEditColorsOpen(true)}
                    className="w-8 h-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                    title="Edit color categories"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}

            {/* Profile Edit Buttons */}
            {isEditingProfile && (
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelProfileEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Profile
                </Button>
              </div>
            )}

            {/* Notes List */}
            <div className="py-4 space-y-3">
              {isLoadingNotes ? (
                <div className="py-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notes for this opponent.
                </p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'MMM d, yyyy')}
                      </span>
                      {editingNoteId !== note.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleStartEditNote(note)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={isSaving}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingNoteBody}
                          onChange={(e) => setEditingNoteBody(e.target.value)}
                          rows={4}
                          disabled={isSaving}
                          className="resize-none"
                          autoComplete="new-password"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          data-form-type="other"
                          data-1p-ignore="true"
                          data-lpignore="true"
                          data-bwignore="true"
                          data-protonpass-ignore="true"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelNoteEdit}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveNote(note.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{note.note_body}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {!isEditingProfile && (
                <Button type="button" onClick={() => setIsEditingProfile(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
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
            {currentProfile?.image_url && (
              <img 
                src={currentProfile.image_url} 
                alt={`${currentProfile?.nickname || 'Opponent'} profile`}
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
