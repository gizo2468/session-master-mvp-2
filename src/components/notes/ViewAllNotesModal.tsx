import React, { useState, useEffect, useMemo } from 'react';
import { StickyNote, Plus, X } from 'lucide-react';
import { useSignedImageUrl } from '@/hooks/useSignedImageUrl';
import { Button } from '@/components/ui/button';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AddNoteModal from './AddNoteModal';
import ViewEditNoteModal from './ViewEditNoteModal';
import { format } from 'date-fns';
import { PLAYER_COLORS, getColorById } from './playerColors';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { resolveSignedUrls } from '@/hooks/useSignedImageUrl';

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
  opponent_profile: OpponentProfile;
}

interface GroupedOpponent {
  profile: OpponentProfile;
  notes: PlayerNote[];
  latestNote: PlayerNote;
  noteCount: number;
}

interface ViewAllNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Reusable opponent row with optional image thumbnail
const OpponentRowInner: React.FC<{
  opponent: GroupedOpponent;
  onClick: () => void;
  onImageClick: (url: string) => void;
}> = ({ opponent, onClick, onImageClick }) => {
  const colorData = getColorById(opponent.profile?.color);
  const signedUrl = useSignedImageUrl('opponent-avatars', opponent.profile?.image_url);

  return (
    <div
      onClick={onClick}
      className="p-3 bg-muted/50 rounded-lg border border-border/30 cursor-pointer hover:bg-muted/70 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              backgroundColor: colorData.hex,
              border: colorData.border ? `1px solid ${colorData.border}` : '1px solid transparent'
            }}
            title={colorData.label}
          />
          {signedUrl && (
            <img
              src={signedUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover flex-shrink-0 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onImageClick(signedUrl); }}
            />
          )}
          <span className="font-medium text-sm truncate">
            {opponent.profile?.nickname || 'Unknown'}
          </span>
          {opponent.noteCount > 1 && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0">
              {opponent.noteCount} notes
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
          {format(new Date(opponent.latestNote.created_at), 'MMM d')}
        </span>
      </div>
      {opponent.latestNote.note_body && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {opponent.latestNote.note_body}
        </p>
      )}
    </div>
  );
};

// Wrap to use as "OpponentRow" in JSX
const OpponentRow = React.memo(OpponentRowInner);

const ViewAllNotesModal: React.FC<ViewAllNotesModalProps> = ({ open, onOpenChange }) => {
  const { isPremium, getNotesLimits } = usePremiumAccess();
  const { user } = useAuth();
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOpponentProfile, setSelectedOpponentProfile] = useState<OpponentProfile | null>(null);
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  const fetchNotes = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('player_notes')
        .select(`
          id,
          note_body,
          created_at,
          updated_at,
          opponent_profile_id,
          opponent_profiles!player_notes_opponent_profile_id_fkey (
            id,
            nickname,
            image_url,
            color
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedNotes: PlayerNote[] = (data || []).map((note: any) => ({
        id: note.id,
        note_body: note.note_body,
        created_at: note.created_at,
        updated_at: note.updated_at,
        opponent_profile_id: note.opponent_profile_id,
        opponent_profile: note.opponent_profiles,
      }));

      const imageUrls = transformedNotes.map(n => n.opponent_profile?.image_url);
      const signedUrls = await resolveSignedUrls('opponent-avatars', imageUrls);
      transformedNotes.forEach((note, i) => {
        if (note.opponent_profile && signedUrls[i]) {
          note.opponent_profile.image_url = signedUrls[i];
        }
      });

      setNotes(transformedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notes when modal opens
  useEffect(() => {
    if (open && user?.id) {
      fetchNotes();
    }
  }, [open, user?.id]);

  const groupedOpponents = useMemo(() => {
    const groups: Record<string, GroupedOpponent> = {};
    notes.forEach(note => {
      const profileId = note.opponent_profile_id;
      if (!groups[profileId]) {
        groups[profileId] = {
          profile: note.opponent_profile,
          notes: [],
          latestNote: note,
          noteCount: 0,
        };
      }
      groups[profileId].notes.push(note);
      groups[profileId].noteCount++;
    });
    return Object.values(groups);
  }, [notes]);

  const usedColors = useMemo(() => {
    const colorIds = new Set<string>();
    groupedOpponents.forEach(opponent => {
      colorIds.add(opponent.profile?.color || 'white');
    });
    return PLAYER_COLORS.filter(color => colorIds.has(color.id));
  }, [groupedOpponents]);

  const filteredOpponents = useMemo(() => {
    let result = [...groupedOpponents];
    if (colorFilter !== 'all') {
      result = result.filter(o => (o.profile?.color || 'white') === colorFilter);
    }
    if (sortOrder === 'oldest') {
      result.sort((a, b) =>
        new Date(a.latestNote.created_at).getTime() - new Date(b.latestNote.created_at).getTime()
      );
    }
    return result;
  }, [groupedOpponents, colorFilter, sortOrder]);

  const { maxNotes } = getNotesLimits();
  const hasReachedLimit = !isPremium && notes.length >= maxNotes;

  const handleOpponentClick = (opponent: GroupedOpponent) => {
    onOpenChange(false);
    setSelectedOpponentProfile(opponent.profile);
    setIsViewModalOpen(true);
  };

  const handleNoteSaved = () => {
    fetchNotes();
    setIsAddModalOpen(false);
  };

  const handleNoteUpdated = () => {
    fetchNotes();
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(val) => {
          onOpenChange(val);
          if (!val) {
            setColorFilter('all');
            setSortOrder('newest');
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto pt-10">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                All Notes
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={hasReachedLimit}
                onClick={() => {
                  onOpenChange(false);
                  setIsAddModalOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Note
              </Button>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="py-4 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <>
              {groupedOpponents.length > 0 && (
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/50">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setColorFilter('all')}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md border transition-colors",
                        colorFilter === 'all'
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 border-border/50 hover:bg-muted"
                      )}
                    >
                      All
                    </button>
                    {usedColors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setColorFilter(color.id)}
                        className={cn(
                          "w-6 h-6 rounded-md border-2 transition-all",
                          colorFilter === color.id
                            ? "ring-2 ring-primary ring-offset-1"
                            : "hover:scale-110"
                        )}
                        style={{
                          backgroundColor: color.hex,
                          borderColor: color.border || 'transparent'
                        }}
                        title={color.label}
                      />
                    ))}
                  </div>
                  <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filteredOpponents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {groupedOpponents.length === 0
                    ? 'No notes yet. Add your first note!'
                    : 'No notes match the selected filter.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredOpponents.map((opponent) => (
                    <OpponentRow
                      key={opponent.profile.id}
                      opponent={opponent}
                      onClick={() => handleOpponentClick(opponent)}
                      onImageClick={(url) => { setFullscreenImageUrl(url); setIsImageFullscreen(true); }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen image lightbox */}
      {isImageFullscreen && fullscreenImageUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 animate-in fade-in-0 duration-200"
          onClick={() => setIsImageFullscreen(false)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setIsImageFullscreen(false); }}
            className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-background/20 backdrop-blur-md text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={fullscreenImageUrl}
            alt="Opponent"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <AddNoteModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onNoteSaved={handleNoteSaved}
        isLimitReached={hasReachedLimit}
      />

      <ViewEditNoteModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        opponentProfile={selectedOpponentProfile}
        onNoteSaved={handleNoteUpdated}
      />
    </>
  );
};

export default ViewAllNotesModal;
