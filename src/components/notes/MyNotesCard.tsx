import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StickyNote, Plus, Lock, Crown, List } from 'lucide-react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import AddNoteModal from './AddNoteModal';
import ViewEditNoteModal from './ViewEditNoteModal';
import { format } from 'date-fns';
import { getColorById } from './playerColors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

const MyNotesCard: React.FC = () => {
  const { isPremium } = usePremiumAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAllNotesModalOpen, setIsAllNotesModalOpen] = useState(false);
  const [selectedOpponentProfile, setSelectedOpponentProfile] = useState<OpponentProfile | null>(null);

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

  useEffect(() => {
    if (isPremium && user?.id) {
      fetchNotes();
    } else {
      setIsLoading(false);
    }
  }, [isPremium, user?.id]);

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

  // Locked state for non-premium users
  if (!isPremium) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-5 w-5" />
            My Notes
            <Lock className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 space-y-3">
            <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Keep private notes on opponents with Premium
            </p>
            <Button
              onClick={() => {
                navigate('/subscription');
                window.scrollTo(0, 0);
              }}
              size="sm"
              className="w-full"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>

          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={() => setIsAllNotesModalOpen(true)}
          >
            <List className="h-4 w-4" />
            View All Notes
          </Button>

          {isLoading ? (
            <div className="py-2 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : totalNotes === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No notes yet. Add your first note!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              {totalOpponents} opponent{totalOpponents !== 1 ? 's' : ''} • {totalNotes} note{totalNotes !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Notes Modal */}
      <Dialog open={isAllNotesModalOpen} onOpenChange={setIsAllNotesModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              All Notes
            </DialogTitle>
          </DialogHeader>
          
          {groupedOpponents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet. Add your first note!
            </p>
          ) : (
            <div className="space-y-2">
              {groupedOpponents.map((opponent) => {
                const colorData = getColorById(opponent.profile?.color);
                return (
                  <div
                    key={opponent.profile.id}
                    onClick={() => {
                      setIsAllNotesModalOpen(false);
                      handleOpponentClick(opponent);
                    }}
                    className="p-3 bg-muted/50 rounded-lg border border-border/30 cursor-pointer hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Color indicator */}
                        <div 
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ 
                            backgroundColor: colorData.hex,
                            border: colorData.border ? `1px solid ${colorData.border}` : '1px solid transparent'
                          }}
                          title={colorData.label}
                        />
                        <span className="font-medium text-sm truncate">
                          {opponent.profile?.nickname || 'Unknown'}
                        </span>
                        {/* Note count badge */}
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {opponent.latestNote.note_body}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddNoteModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onNoteSaved={handleNoteSaved}
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
