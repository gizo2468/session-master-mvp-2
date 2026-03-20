import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StickyNote, Plus, Crown, List, Search, X } from 'lucide-react';
import { useSignedImageUrl } from '@/hooks/useSignedImageUrl';
import { Input } from '@/components/ui/input';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import AddNoteModal from './AddNoteModal';
import ViewEditNoteModal from './ViewEditNoteModal';
import { format } from 'date-fns';
import { getColorById } from './playerColors';
import { cn } from '@/lib/utils';
import { resolveSignedUrls } from '@/hooks/useSignedImageUrl';
import ViewAllNotesModal from './ViewAllNotesModal';

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

const OpponentRow = React.memo(OpponentRowInner);

const MyNotesCard: React.FC = () => {
  const { isPremium, getNotesLimits } = usePremiumAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAllNotesModalOpen, setIsAllNotesModalOpen] = useState(false);
  const [selectedOpponentProfile, setSelectedOpponentProfile] = useState<OpponentProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      
      // Transform the data to match our interface
      const transformedNotes: PlayerNote[] = (data || []).map((note: any) => ({
        id: note.id,
        note_body: note.note_body,
        created_at: note.created_at,
        updated_at: note.updated_at,
        opponent_profile_id: note.opponent_profile_id,
        opponent_profile: note.opponent_profiles,
      }));
      
      // Resolve signed URLs for opponent avatars (private bucket)
      const imageUrls = transformedNotes.map(n => n.opponent_profile?.image_url);
      const signedUrls = await resolveSignedUrls('opponent-avatars', imageUrls);
      
      // Update notes with signed URLs
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

  // Group notes by opponent profile (no limit for modal display)
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
      // latestNote is already set to the first note (most recent due to ordering)
    });
    
    return Object.values(groups);
  }, [notes]);

  // Calculate totals for summary display
  const totalOpponents = groupedOpponents.length;
  const totalNotes = notes.length;

  // Filter grouped opponents by search query (matches against nickname)
  const filteredOpponents = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedOpponents;
    }
    const query = searchQuery.toLowerCase().trim();
    return groupedOpponents.filter(opponent => 
      opponent.profile?.nickname?.toLowerCase().includes(query)
    );
  }, [groupedOpponents, searchQuery]);

  // Notes limit logic for free users
  const { maxNotes } = getNotesLimits();
  const hasReachedLimit = !isPremium && totalNotes >= maxNotes;

  useEffect(() => {
    if (user?.id) {
      fetchNotes();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handleNoteSaved = () => {
    fetchNotes();
    setIsAddModalOpen(false);
  };

  const handleNoteUpdated = () => {
    fetchNotes();
  };

  const handleOpponentClick = (opponent: GroupedOpponent) => {
    setSelectedOpponentProfile(opponent.profile);
    setIsViewModalOpen(true);
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-5 w-5" />
            My Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
            disabled={hasReachedLimit}
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>

          {/* Show limit message when reached */}
          {hasReachedLimit && (
            <div className="text-center space-y-2 p-3 bg-muted/50 rounded-lg border border-border/30">
              <p className="text-sm text-muted-foreground">
                Free plan allows up to 10 notes.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  navigate('/subscription');
                  window.scrollTo(0, 0);
                }}
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade for Unlimited
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={() => setIsAllNotesModalOpen(true)}
          >
            <List className="h-4 w-4" />
            View All Notes
          </Button>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search opponents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoComplete="off"
              data-form-type="other"
              data-1p-ignore="true"
              data-lpignore="true"
            />
          </div>

          {/* Search Results - only show when searching */}
          {searchQuery.trim() && (
            <div className="space-y-2">
              {filteredOpponents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No opponents match your search.
                </p>
              ) : (
                filteredOpponents.map((opponent) => (
                  <OpponentRow
                    key={opponent.profile.id}
                    opponent={opponent}
                    onClick={() => handleOpponentClick(opponent)}
                    onImageClick={(url) => { setFullscreenImageUrl(url); setIsImageFullscreen(true); }}
                  />
                ))
              )}
            </div>
          )}

          {/* Summary - only show when NOT searching */}
          {!searchQuery.trim() && (
            isLoading ? (
              <div className="py-2 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : totalNotes === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No notes yet. Add your first note!
              </p>
            ) : (
              <div className="text-center py-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  {totalOpponents} opponent{totalOpponents !== 1 ? 's' : ''} • {totalNotes} note{totalNotes !== 1 ? 's' : ''}
                </p>
                {!isPremium && totalNotes > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {totalNotes}/{maxNotes} notes used
                  </p>
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>

      <ViewAllNotesModal
        open={isAllNotesModalOpen}
        onOpenChange={setIsAllNotesModalOpen}
      />

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

export default MyNotesCard;
