import React, { useState, useEffect } from 'react';
// Layout: Position chip + hole cards on same row
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Pencil, User, Camera, X, Check, MoreHorizontal, Trash2, ExternalLink, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { SELECTABLE_COLORS, DEFAULT_COLOR, PlayerColorId, getColorById } from './playerColors';
import EditColorCategoriesModal from './EditColorCategoriesModal';
import { useColorLabels } from '@/hooks/useColorLabels';
import { useNavigate } from 'react-router-dom';
import HandDetailsDialog from '@/components/poker/HandDetailsDialog';
import CardDisplay from '@/components/poker/CardDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSignedImageUrl } from '@/hooks/useSignedImageUrl';
import { useNativeImagePicker } from '@/hooks/useNativeImagePicker';

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
  const [editingNickname, setEditingNickname] = useState('');
  const [linkedHands, setLinkedHands] = useState<any[]>([]);
  const [isLoadingHands, setIsLoadingHands] = useState(false);
  const [showLinkedHands, setShowLinkedHands] = useState(false);
  const [selectedHand, setSelectedHand] = useState<any>(null);
  const [showHandDetails, setShowHandDetails] = useState(false);
  const navigate = useNavigate();
  const { pickImage: nativePickImage, isLoading: isPickingImage, isNative } = useNativeImagePicker();

  // Fetch all notes for this opponent when modal opens
  useEffect(() => {
    if (open && opponentProfile?.id && user?.id) {
      fetchNotesForOpponent();
      fetchLinkedHands();
      setCurrentProfile(opponentProfile);
      setSelectedColor((opponentProfile.color as PlayerColorId) || DEFAULT_COLOR);
      setEditingNickname(opponentProfile.nickname || '');
      setIsEditingProfile(false);
      setEditingNoteId(null);
      setImageFile(null);
      setImagePreview(null);
      setShowLinkedHands(false);
      setSelectedHand(null);
      setShowHandDetails(false);
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

  const fetchLinkedHands = async () => {
    if (!opponentProfile?.id || !user?.id) return;

    try {
      setIsLoadingHands(true);
      const { data, error } = await supabase
        .from('session_hands_new')
        .select(`
          id,
          hole_cards,
          flop_cards,
          turn_card,
          river_card,
          position,
          preflop_action,
          flop_action,
          turn_action,
          river_action,
          showdown_result,
          pot_size,
          amount_invested,
          amount_won,
          currency_type,
          created_at,
          session_id,
          table_id,
          hand_notes,
          opponent_profile_id,
          opponent_profile_ids,
          villains,
          small_blind,
          big_blind,
          hero_stack_bb,
          game_type,
          flop_actions,
          turn_actions,
          river_actions,
          result_value,
          result_unit
        `)
        .eq('user_id', user.id)
        .or(`opponent_profile_id.eq.${opponentProfile.id},opponent_profile_ids.cs.["${opponentProfile.id}"]`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinkedHands(data || []);
    } catch (error) {
      console.error('Error fetching linked hands:', error);
    } finally {
      setIsLoadingHands(false);
    }
  };

  const handleImageClick = async () => {
    if (isNative) {
      const result = await nativePickImage('prompt');
      if (result) {
        setImagePreview(result.dataUrl);
        setImageFile(null);
      }
    } else {
      document.getElementById('edit-avatar-upload')?.click();
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

  const uploadImage = async (fileOrDataUrl: File | string): Promise<string | null> => {
    if (!user?.id) return null;
    
    // If it's a data URL string, convert to blob
    if (typeof fileOrDataUrl === 'string') {
      const response = await fetch(fileOrDataUrl);
      const blob = await response.blob();
      const fileName = `${user.id}/${uuidv4()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('opponent-avatars')
        .upload(fileName, blob);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('opponent-avatars')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    }
    
    // Otherwise it's a File
    const fileExt = fileOrDataUrl.name.split('.').pop();
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('opponent-avatars')
      .upload(fileName, fileOrDataUrl);

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

    // Validate nickname
    if (!editingNickname.trim()) {
      toast({
        title: 'Name required',
        description: 'Opponent name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      // Upload new image if changed
      let imageUrl = currentProfile.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      } else if (imagePreview && imagePreview.startsWith('data:')) {
        // From native picker (dataUrl)
        imageUrl = await uploadImage(imagePreview);
      }

      // Update opponent profile
      const { error: profileError } = await supabase
        .from('opponent_profiles')
        .update({ 
          nickname: editingNickname.trim(),
          image_url: imageUrl,
          color: selectedColor,
        })
        .eq('id', currentProfile.id)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update local state
      setCurrentProfile({
        ...currentProfile,
        nickname: editingNickname.trim(),
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
    setEditingNickname(currentProfile?.nickname || '');
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

  // Get signed URL for opponent avatar (private bucket)
  const signedAvatarUrl = useSignedImageUrl('opponent-avatars', currentProfile?.image_url);
  
  // Get the current display image (prefer local preview, then signed URL)
  const displayImage = imagePreview || signedAvatarUrl;
  const colorData = getColorById(currentProfile?.color);

  if (!opponentProfile) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`sm:max-w-md max-h-[85vh] ${showLinkedHands ? 'overflow-hidden' : 'overflow-y-auto'}`} data-form-type="other">
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
                  className={`relative w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all duration-200 cursor-pointer group bg-muted flex items-center justify-center overflow-hidden ${isPickingImage ? 'opacity-50' : ''}`}
                  onClick={handleImageClick}
                >
                  {isPickingImage ? (
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  ) : displayImage ? (
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
                    signedAvatarUrl ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200' : ''
                  }`}
                  onClick={() => signedAvatarUrl && setIsImageFullscreen(true)}
                >
                  {signedAvatarUrl ? (
                    <img 
                      src={signedAvatarUrl} 
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
                {isEditingProfile ? (
                  <Input
                    value={editingNickname}
                    onChange={(e) => setEditingNickname(e.target.value)}
                    placeholder="Opponent name"
                    className="text-center text-lg font-semibold h-9 w-48"
                    disabled={isSaving}
                    autoComplete="off"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-bwignore="true"
                    data-protonpass-ignore="true"
                  />
                ) : (
                  <h2 className="text-lg font-semibold">{currentProfile?.nickname || 'Unknown'}</h2>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
              
              {/* View Hands Button */}
              {!isEditingProfile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLinkedHands(true)}
                  className="mt-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Hands ({linkedHands.length})
                </Button>
              )}
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

            {/* Content - toggle between Notes and Linked Hands */}
            {!showLinkedHands ? (
              /* Notes List */
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
            ) : (
              /* Linked Hands List */
              <div className="py-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLinkedHands(false)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Notes
                  </Button>
                </div>
                
                <ScrollArea className="h-[300px] pr-4">
                  {isLoadingHands ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : linkedHands.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        No hands linked yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Link hands when adding them in the Street-by-Street form
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedHands.map((hand) => (
                        <div
                          key={hand.id}
                          onClick={() => {
                            setSelectedHand(hand);
                            setShowHandDetails(true);
                          }}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {hand.position && (
                                <span className="text-xs font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                  {hand.position}
                                </span>
                              )}
                              {hand.hole_cards && (
                                <CardDisplay cards={hand.hole_cards} size="sm" />
                              )}
                            </div>
                            {hand.preflop_action && (
                              <div className="text-xs text-muted-foreground">
                                {hand.preflop_action.substring(0, 50)}
                                {hand.preflop_action.length > 50 ? '...' : ''}
                              </div>
                            )}
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {!isEditingProfile && !showLinkedHands && (
                <Button type="button" onClick={() => setIsEditingProfile(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hand Details Dialog */}
      <HandDetailsDialog
        open={showHandDetails}
        onOpenChange={setShowHandDetails}
        hand={selectedHand ? {
          id: selectedHand.id,
          cards: selectedHand.hole_cards || '',
          position: selectedHand.position || '',
          action: selectedHand.preflop_action || '',
          flopCards: selectedHand.flop_cards ? selectedHand.flop_cards.match(/.{1,2}/g) || [] : [],
          turnCard: selectedHand.turn_card || '',
          riverCard: selectedHand.river_card || '',
          preflopActionSequence: selectedHand.preflop_action ? 
            selectedHand.preflop_action.split('\n').map((line: string) => {
              const parts = line.split(':');
              return { player: parts[0]?.trim(), action: parts[1]?.trim() };
            }).filter((a: any) => a.player && a.action) : [],
          flopActionSequence: selectedHand.flop_action ? 
            selectedHand.flop_action.split('\n').map((line: string) => {
              const parts = line.split(':');
              return { player: parts[0]?.trim(), action: parts[1]?.trim() };
            }).filter((a: any) => a.player && a.action) : [],
          turnActionSequence: selectedHand.turn_action ? 
            selectedHand.turn_action.split('\n').map((line: string) => {
              const parts = line.split(':');
              return { player: parts[0]?.trim(), action: parts[1]?.trim() };
            }).filter((a: any) => a.player && a.action) : [],
          riverActionSequence: selectedHand.river_action ? 
            selectedHand.river_action.split('\n').map((line: string) => {
              const parts = line.split(':');
              return { player: parts[0]?.trim(), action: parts[1]?.trim() };
            }).filter((a: any) => a.player && a.action) : [],
          showdownResult: selectedHand.showdown_result || '',
          potSize: selectedHand.pot_size || 0,
          amountInvested: selectedHand.amount_invested || 0,
          amountWon: selectedHand.amount_won || 0,
          currencyType: selectedHand.currency_type || 'currency',
          tableId: selectedHand.table_id,
          sessionId: selectedHand.session_id,
          createdAt: new Date(selectedHand.created_at),
          // Additional fields for complete hand data - parse JSONB safely
          villains: Array.isArray(selectedHand.villains) 
            ? selectedHand.villains 
            : (typeof selectedHand.villains === 'string' ? JSON.parse(selectedHand.villains) : []),
          gameType: selectedHand.game_type,
          smallBlind: selectedHand.small_blind,
          bigBlind: selectedHand.big_blind,
          heroStackBB: selectedHand.hero_stack_bb,
          flopActions: Array.isArray(selectedHand.flop_actions) 
            ? selectedHand.flop_actions 
            : (typeof selectedHand.flop_actions === 'string' ? JSON.parse(selectedHand.flop_actions) : []),
          turnActions: Array.isArray(selectedHand.turn_actions) 
            ? selectedHand.turn_actions 
            : (typeof selectedHand.turn_actions === 'string' ? JSON.parse(selectedHand.turn_actions) : []),
          riverActions: Array.isArray(selectedHand.river_actions) 
            ? selectedHand.river_actions 
            : (typeof selectedHand.river_actions === 'string' ? JSON.parse(selectedHand.river_actions) : []),
          resultValue: selectedHand.result_value,
          resultUnit: selectedHand.result_unit,
          notes: selectedHand.hand_notes,
          opponentProfileId: selectedHand.opponent_profile_id,
          opponentProfileIds: Array.isArray(selectedHand.opponent_profile_ids) 
            ? selectedHand.opponent_profile_ids 
            : (typeof selectedHand.opponent_profile_ids === 'string' ? JSON.parse(selectedHand.opponent_profile_ids) : []),
        } : null}
      />

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
            {signedAvatarUrl && (
              <img 
                src={signedAvatarUrl} 
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
