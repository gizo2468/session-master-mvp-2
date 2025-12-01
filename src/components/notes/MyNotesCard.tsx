import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StickyNote, Plus, Lock, Crown } from 'lucide-react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import AddNoteModal from './AddNoteModal';
import ViewEditNoteModal from './ViewEditNoteModal';
import { format } from 'date-fns';
import { getColorById } from './playerColors';

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

const MyNotesCard: React.FC = () => {
  const { isPremium } = usePremiumAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<PlayerNote | null>(null);

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
        .order('created_at', { ascending: false })
        .limit(5);

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

  const handleNoteClick = (note: PlayerNote) => {
    setSelectedNote(note);
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

          {isLoading ? (
            <div className="py-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet. Add your first note!
            </p>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => {
                const colorData = getColorById(note.opponent_profile?.color);
                return (
                  <div
                    key={note.id}
                    onClick={() => handleNoteClick(note)}
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
                          {note.opponent_profile?.nickname || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {format(new Date(note.created_at), 'MMM d')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.note_body}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddNoteModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onNoteSaved={handleNoteSaved}
      />

      <ViewEditNoteModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        note={selectedNote}
        onNoteSaved={handleNoteUpdated}
      />
    </>
  );
};

export default MyNotesCard;
