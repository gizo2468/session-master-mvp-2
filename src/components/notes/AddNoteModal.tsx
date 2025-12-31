import React, { useState } from 'react';
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
import { Save, Loader2, Camera, Check, MoreHorizontal } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { SELECTABLE_COLORS, DEFAULT_COLOR, PlayerColorId } from './playerColors';
import EditColorCategoriesModal from './EditColorCategoriesModal';
import { useColorLabels } from '@/hooks/useColorLabels';
import OpponentAutocomplete from './OpponentAutocomplete';

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteSaved: () => void;
}

interface OpponentProfile {
  id: string;
  nickname: string;
  image_url: string | null;
  color: string | null;
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
  const [selectedColor, setSelectedColor] = useState<PlayerColorId | null>(null);
  const [editColorsOpen, setEditColorsOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { getLabel } = useColorLabels();

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

    // Store a reference URL in the database (path can be extracted from this)
    // The actual display will use signed URLs when fetching
    const { data: urlData } = supabase.storage
      .from('opponent-avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSelectExistingProfile = (profile: OpponentProfile) => {
    setSelectedProfileId(profile.id);
    // Auto-fill image and color from existing profile
    if (profile.image_url) {
      setImagePreview(profile.image_url);
      setImageFile(null); // Clear any new file since we're using existing
    }
    if (profile.color) {
      setSelectedColor(profile.color as PlayerColorId);
    }
  };

  const handleNameChange = (name: string) => {
    setOpponentName(name);
    // Clear selected profile if user is typing a different name
    if (selectedProfileId) {
      setSelectedProfileId(null);
    }
  };

  const findOrCreateOpponentProfile = async (
    nickname: string,
    imageUrl: string | null,
    color: string
  ): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated');

    // If we already selected an existing profile, use it
    if (selectedProfileId) {
      // Optionally update image/color if user provided new ones
      const updates: Record<string, string | null> = {};
      if (imageUrl) updates.image_url = imageUrl;
      if (color !== DEFAULT_COLOR) updates.color = color;
      
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('opponent_profiles')
          .update(updates)
          .eq('id', selectedProfileId);
      }
      return selectedProfileId;
    }

    // Check if profile exists (case-insensitive)
    const { data: existingProfile, error: fetchError } = await supabase
      .from('opponent_profiles')
      .select('id')
      .eq('user_id', user.id)
      .ilike('nickname', nickname.trim())
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingProfile) {
      // Profile exists, optionally update image/color if provided
      if (imageUrl || color !== DEFAULT_COLOR) {
        const updates: Record<string, string | null> = {};
        if (imageUrl) updates.image_url = imageUrl;
        if (color !== DEFAULT_COLOR) updates.color = color;
        
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('opponent_profiles')
            .update(updates)
            .eq('id', existingProfile.id);
        }
      }
      return existingProfile.id;
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('opponent_profiles')
      .insert({
        user_id: user.id,
        nickname: nickname.trim(),
        image_url: imageUrl,
        color: color,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return newProfile.id;
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
      
      // Upload image if a new file was selected
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Find or create opponent profile
      const profileId = await findOrCreateOpponentProfile(
        opponentName,
        imageUrl,
        selectedColor || DEFAULT_COLOR
      );

      // Create the note linked to the profile
      const { error } = await supabase.from('player_notes').insert({
        user_id: user.id,
        opponent_profile_id: profileId,
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
      setImageFile(null);
      setImagePreview(null);
      setSelectedColor(null);
      setSelectedProfileId(null);
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
      setSelectedColor(null);
      setSelectedProfileId(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-form-type="other">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>

        <form
          autoComplete="off" 
          data-form-type="other"
          data-credential="false"
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
                data-credential="false"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                data-protonpass-ignore="true"
              />
            </div>

            <div className="space-y-2">
              <Label>Opponent Name / Online Nickname</Label>
              <OpponentAutocomplete
                value={opponentName}
                onChange={handleNameChange}
                onSelectProfile={handleSelectExistingProfile}
                disabled={isSaving}
                placeholder="Enter player nickname..."
              />
              {selectedProfileId && (
                <p className="text-xs text-green-600">
                  Adding note to existing opponent profile
                </p>
              )}
            </div>

            {/* Player Color Tag */}
            <div className="space-y-2">
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
                
                {/* Edit color categories button - right side, vertically centered */}
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

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                placeholder="Write your thoughts about this player..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={4}
                disabled={isSaving}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
                data-credential="false"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                data-protonpass-ignore="true"
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
      
      {/* Edit Color Categories Modal */}
      <EditColorCategoriesModal 
        open={editColorsOpen} 
        onOpenChange={setEditColorsOpen} 
      />
    </Dialog>
  );
};

export default AddNoteModal;
