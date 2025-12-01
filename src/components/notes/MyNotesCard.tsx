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
import { getColorById } from './playerColors';

interface OpponentWithNotes {
  id: string;
  nickname: string;
  image_url: string | null;
  color: string | null;
  note_count: number;
  latest_note_preview: string;
  latest_note_date: string;
}

const MyNotesCard: React.FC = () => {
  const { isPremium } = usePremiumAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opponents, setOpponents] = useState<OpponentWithNotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentWithNotes | null>(null);

  const fetchOpponentsWithNotes = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch opponent profiles that have notes, with note count and latest note info
      const { data: opponentProfiles, error: profilesError } = await supabase
        .from('opponent_profiles')
        .select('id, nickname, image_url, color')
        .eq('user_id', user.id);

      if (profilesError) throw profilesError;

      // For each opponent, get their note count and latest note
      const opponentsWithNotes: OpponentWithNotes[] = [];
      
      for (const profile of opponentProfiles || []) {
        const { data: notes, error: notesError } = await supabase
          .from('player_notes')
          .select('note_body, created_at')
          .eq('opponent_profile_id', profile.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (notesError) throw notesError;

        // Only include opponents that have at least one note
        if (notes && notes.length > 0) {
          opponentsWithNotes.push({
            id: profile.id,
            nickname: profile.nickname,
            image_url: profile.image_url,
            color: profile.color,
            note_count: notes.length,
            latest_note_preview: notes[0].note_body,
            latest_note_date: notes[0].created_at,
          });
        }
      }

      // Sort by latest note date descending
      opponentsWithNotes.sort((a, b) => 
        new Date(b.latest_note_date).getTime() - new Date(a.latest_note_date).getTime()
      );

      // Limit to 5 for display
      setOpponents(opponentsWithNotes.slice(0, 5));
    } catch (error) {
      console.error('Error fetching opponents with notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium && user?.id) {
      fetchOpponentsWithNotes();
    } else {
      setIsLoading(false);
    }
  }, [isPremium, user?.id]);

  const handleNoteSaved = () => {
    fetchOpponentsWithNotes();
    setIsAddModalOpen(false);
  };

  const handleOpponentUpdated = () => {
    fetchOpponentsWithNotes();
  };

  const handleOpponentClick = (opponent: OpponentWithNotes) => {
    setSelectedOpponent(opponent);
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
          ) : opponents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet. Add your first note!
            </p>
          ) : (
            <div className="space-y-2">
              {opponents.map((opponent) => {
                const colorData = getColorById(opponent.color);
                return (
                  <div
                    key={opponent.id}
                    onClick={() => handleOpponentClick(opponent)}
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
                          {opponent.nickname}
                        </span>
                        {/* Note count badge */}
                        {opponent.note_count > 1 && (
                          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {opponent.note_count} notes
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {opponent.latest_note_preview}
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
        opponentProfile={selectedOpponent}
        onNoteSaved={handleOpponentUpdated}
      />
    </>
  );
};

export default MyNotesCard;
