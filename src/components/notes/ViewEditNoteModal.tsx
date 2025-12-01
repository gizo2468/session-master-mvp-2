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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Pencil, User, Camera, X, Check, MoreHorizontal, Trash2, Plus } from 'lucide-react';
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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [editColorsOpen, setEditColorsOpen] = useState(false);
  const { getLabel } = useColorLabels();
  const [selectedColor, setSelectedColor] = useState<PlayerColorId>(DEFAULT_COLOR);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState('');

  // Fetch all notes for this opponent when modal opens
  useEffect(() => {
    if (open && opponentProfile?.id && user?.id) {
      fetchNotes();
      setSelectedColor((opponentProfile.color as PlayerColorId) || DEFAULT_COLOR);
      setIsEditingProfile(false);
      setEditingNoteId(null);
      setImageFile(null);
      setImagePreview(null);
      setIsImageFullscreen(false);
      setIsAddingNote(false);
      setNewNoteBody('');
    }
  }, [open, opponentProfile?.id, user?.id]);

  const fetchNotes = async () => {
    if (!opponentProfile?.id || !user?.id) return;
    
    try {
      setIsLoadingNotes(true);
      const { data, error } = await supabase
        .from('player_notes')
        .select('id, note_body, created_at, updated_at')
        .eq('opponent_profile_id', opponentProfile.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
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
    if (!user?.id || !opponentProfile) return;

    try {
      setIsSaving(true);

      let imageUrl = opponentProfile.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('opponent_profiles')
        .update({ 
          image_url: imageUrl,
          color: selectedColor,
        })
        .eq('id', opponentProfile.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Opponent profile has been updated.',
      });

      setIsEditingProfile(false);
      onNoteSaved();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNote = async (noteId: string) => {
    if (!user?.id || !editingNoteBody.trim()) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('player_notes')
        .update({ note_body: editingNoteBody.trim() })
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Note updated',
        description: 'Your note has been updated.',
      });

      setEditingNoteId(null);
      fetchNotes();
      onNoteSaved();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user?.id) return;

    try {
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
      
      fetchNotes();
      onNoteSaved();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note.',
        variant: 'destructive',
      });
    }
  };

  const handleAddNote = async () => {
    if (!user?.id || !opponentProfile?.id || !newNoteBody.trim()) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('player_notes')
        .insert({
          user_id: user.id,
          opponent_profile_id: opponentProfile.id,
          note_body: newNoteBody.trim(),
        });

      if (error) throw error;

      toast({
        title: 'Note added',
        description: 'Your note has been added.',
      });

      setIsAddingNote(false);
      setNewNoteBody('');
      fetchNotes();
      onNoteSaved();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingNote = (note: PlayerNote) => {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.note_body);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteBody('');
  };

  const cancelEditingProfile = () => {
    if (opponentProfile) {
      setSelectedColor((opponentProfile.color as PlayerColorId) || DEFAULT_COLOR);
    }
    setImageFile(null);
    setImagePreview(null);
    setIsEditingProfile(false);
  };

  const displayImage = imagePreview || opponentProfile?.image_url;
  const colorData = getColorById(opponentProfile?.color);

  if (!opponentProfile) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col" data-form-type="other">
          <DialogHeader className="sr-only">
            <DialogTitle>{opponentProfile.nickname}</DialogTitle>
          </DialogHeader>

          <form
            autoComplete="off" 
            data-form-type="other"
            data-credential="false"
            role="presentation"
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-3 pt-2 flex-shrink-0">
              {isEditingProfile ? (
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
                <div 
                  className={`w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden ${
                    opponentProfile.image_url ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200' : ''
                  }`}
                  onClick={() => opponentProfile.image_url && setIsImageFullscreen(true)}
                >
                  {opponentProfile.image_url ? (
                    <img 
                      src={opponentProfile.image_url} 
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
              
              {/* Opponent name with color indicator */}
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
                <h2 className="text-lg font-semibold">{opponentProfile.nickname}</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>

            {/* Color Selector (Edit Profile Mode only) */}
            {isEditingProfile && (
              <div className="space-y-2 mt-4 flex-shrink-0">
                <Label>Player Color Tag</Label>
                <div className="flex items-center gap-x-3">
                  <div className="flex flex-col gap-y-1">
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
              <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelEditingProfile}
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
            <div className="flex-1 min-h-0 mt-4">
              {isLoadingNotes ? (
                <div className="py-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <ScrollArea className="h-full max-h-[300px]">
                  <div className="space-y-3 pr-4">
                    {/* Add Note Form */}
                    {isAddingNote ? (
                      <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                        <Textarea
                          value={newNoteBody}
                          onChange={(e) => setNewNoteBody(e.target.value)}
                          placeholder="Write your note..."
                          rows={3}
                          disabled={isSaving}
                          className="resize-none mb-2"
                          autoComplete="new-password"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          data-form-type="other"
                          data-1p-ignore="true"
                          data-lpignore="true"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { setIsAddingNote(false); setNewNoteBody(''); }}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddNote}
                            disabled={isSaving || !newNoteBody.trim()}
                          >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setIsAddingNote(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    )}

                    {/* Existing Notes */}
                    {notes.map((note) => (
                      <div key={note.id} className="bg-muted/30 rounded-lg p-3 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), 'MMM d, yyyy')}
                          </span>
                          {editingNoteId !== note.id && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => startEditingNote(note)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {editingNoteId === note.id ? (
                          <>
                            <Textarea
                              value={editingNoteBody}
                              onChange={(e) => setEditingNoteBody(e.target.value)}
                              rows={3}
                              disabled={isSaving}
                              className="resize-none mb-2"
                              autoComplete="new-password"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck={false}
                              data-form-type="other"
                              data-1p-ignore="true"
                              data-lpignore="true"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cancelEditingNote}
                                disabled={isSaving}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveNote(note.id)}
                                disabled={isSaving || !editingNoteBody.trim()}
                              >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{note.note_body}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-4 flex-shrink-0 border-t border-border/30 mt-4">
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
            <button
              onClick={() => setIsImageFullscreen(false)}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
              aria-label="Close fullscreen image"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            
            {opponentProfile.image_url && (
              <img 
                src={opponentProfile.image_url} 
                alt={`${opponentProfile.nickname} profile`}
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
