import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import Icon from '@/components/ui/Lucide';
import ProfitLossBadge from '@/components/poker/ProfitLossBadge';
import CardDisplay from '@/components/poker/CardDisplay';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { createNotification, deleteNotificationByFeedbackId } from '@/services/notificationService';

interface HandData {
  id: string;
  hand_number?: number;
  position?: string;
  hole_cards?: string;
  preflop_action?: string;
  flop_cards?: string;
  flop_action?: string;
  turn_card?: string;
  turn_action?: string;
  river_card?: string;
  river_action?: string;
  showdown_result?: string;
  hand_notes?: string;
  hand_image?: string;
  pot_size?: number;
  amount_invested?: number;
  amount_won?: number;
}

interface SessionDetails {
  game_type?: string;
  currency?: string;
  small_blind?: number;
  big_blind?: number;
}

interface HandReviewModalProps {
  open: boolean;
  onClose: () => void;
  // Option A: Pass full data directly (used by SharedSessionModal)
  hand?: HandData | null;
  sessionDetails?: SessionDetails | null;
  // Option B: Pass IDs for lazy loading (used by CoachProfile for instant open)
  handId?: string;
  sessionId?: string;
  // Common props
  currentUserId?: string;
  playerId: string;
  coachId?: string;
  isCoach?: boolean;
}

export const HandReviewModal: React.FC<HandReviewModalProps> = ({
  open,
  onClose,
  hand: propHand,
  sessionDetails: propSessionDetails,
  handId,
  sessionId,
  currentUserId,
  playerId,
  coachId,
  isCoach = false
}) => {
  const [feedback, setFeedback] = useState('');
  const [feedbackEntries, setFeedbackEntries] = useState<Array<{
    id: string;
    feedback_content: string;
    created_at: string;
    coach_id: string;
    seen_at: string | null;
  }>>([]);
  const [isTogglingLike, setIsTogglingLike] = useState<string | null>(null);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [handImage, setHandImage] = useState<string | null>(null);
  const [loadingHandImage, setLoadingHandImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Internal loading state for lazy-loaded data
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [internalHand, setInternalHand] = useState<HandData | null>(null);
  const [internalSessionDetails, setInternalSessionDetails] = useState<SessionDetails | null>(null);

  const { toast } = useToast();

  // Use prop data if provided, otherwise use internally loaded data
  const hand = propHand || internalHand;
  const sessionDetails = propSessionDetails || internalSessionDetails;

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'USD':
      default: return '$';
    }
  };

  // Lazy load hand image on demand
  const loadHandImage = async (id: string): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from('session_hands_new')
        .select('hand_image')
        .eq('id', id)
        .single();
      return data?.hand_image || null;
    } catch (error) {
      console.error('Error loading hand image:', error);
      return null;
    }
  };

  // Load hand and session data when using lazy loading mode (handId + sessionId)
  useEffect(() => {
    if (!open || propHand || !handId) {
      // Either closed, or already have prop data, or no handId for lazy load
      return;
    }

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch hand and session details in parallel
        const [handResult, sessionResult] = await Promise.all([
          supabase
            .from('session_hands_new')
            .select('*')
            .eq('id', handId)
            .single(),
          sessionId 
            ? supabase
                .from('sessions')
                .select('game_type, currency, small_blind, big_blind')
                .eq('id', sessionId)
                .single()
            : Promise.resolve({ data: null, error: null })
        ]);

        if (handResult.error || !handResult.data) {
          console.error('Error loading hand details:', handResult.error);
          return;
        }

        setInternalHand(handResult.data);
        setInternalSessionDetails(sessionResult.data || null);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [open, propHand, handId, sessionId]);

  // Load existing feedback when modal opens
  const loadFeedback = async (id: string) => {
    if (!currentUserId) return;
    
    try {
      let query = supabase
        .from('hand_feedback')
        .select('*')
        .eq('hand_id', id);

      if (isCoach && coachId) {
        // Coach: load only their own feedback for this hand
        query = query
          .eq('coach_id', coachId)
          .eq('student_id', playerId);
      } else {
        // Player: load all feedback for this hand where they are the student
        query = query.eq('student_id', playerId);
      }

      const { data: feedbackData, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading feedback:', error);
        return;
      }

      setFeedbackEntries(feedbackData || []);
      setFeedback('');
    } catch (error) {
      console.error('Error in loadFeedback:', error);
    }
  };

  // Delete feedback
  const deleteFeedback = async (feedbackId: string) => {
    if (!currentUserId || !isCoach) return;

    try {
      const { error } = await supabase
        .from('hand_feedback')
        .delete()
        .eq('id', feedbackId)
        .eq('coach_id', currentUserId);

      if (error) throw error;

      setFeedbackEntries(prev => prev.filter(entry => entry.id !== feedbackId));
      
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to delete feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Save feedback
  const saveFeedback = async () => {
    if (!hand?.id || !currentUserId || !isCoach || !feedback.trim() || !coachId) {
      return;
    }

    setIsSavingFeedback(true);
    try {
      const feedbackData = {
        hand_id: hand.id,
        coach_id: coachId,
        student_id: playerId,
        feedback_content: feedback.trim()
      };

      const { data: newFeedback, error } = await supabase
        .from('hand_feedback')
        .insert(feedbackData)
        .select()
        .single();

      if (error) throw error;

      if (newFeedback) {
        setFeedbackEntries(prev => [...prev, newFeedback]);
        // Note: Notification is created automatically by database trigger (create_feedback_notification)
      }

      setFeedback('');
      
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingFeedback(false);
    }
  };

  // Toggle feedback like (student only)
  const toggleFeedbackLike = async (entry: typeof feedbackEntries[0]) => {
    if (!currentUserId || isCoach) return;
    
    setIsTogglingLike(entry.id);
    const isCurrentlyLiked = !!entry.seen_at;
    
    try {
      // Toggle: if liked -> set null, if not liked -> set timestamp
      const newSeenAt = isCurrentlyLiked ? null : new Date().toISOString();
      
      // Update database
      const { error } = await supabase
        .from('hand_feedback')
        .update({ seen_at: newSeenAt })
        .eq('id', entry.id);
      
      if (error) throw error;
      
      // Update local state
      setFeedbackEntries(prev => 
        prev.map(e => e.id === entry.id ? { ...e, seen_at: newSeenAt } : e)
      );
      
      if (!isCurrentlyLiked) {
        // LIKING: Create notification with feedback_id for later deletion
        const { data: studentProfile } = await supabase
          .from('profiles')
          .select('online_nickname, username')
          .eq('id', currentUserId)
          .single();
        
        const studentName = studentProfile?.online_nickname || studentProfile?.username || 'Student';
        
        await createNotification({
          recipient_user_id: entry.coach_id,
          sender_user_id: currentUserId,
          type: 'feedback_seen',
          title: `${studentName} liked your feedback`,
          body: 'Your coaching feedback has been appreciated.',
          hand_id: hand?.id || null,
          feedback_id: entry.id
        });
      } else {
        // UNLIKING: Remove the notification for this feedback
        await deleteNotificationByFeedbackId(entry.id, currentUserId);
      }
    } catch (error) {
      console.error('Error toggling feedback like:', error);
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTogglingLike(null);
    }
  };

  // Load feedback and hand image when modal opens and hand data is available
  useEffect(() => {
    if (open && hand?.id && currentUserId) {
      loadFeedback(hand.id);
      // Lazy load hand image if not already provided
      if (!hand.hand_image) {
        setLoadingHandImage(true);
        setHandImage(null);
        loadHandImage(hand.id).then(image => {
          setHandImage(image);
          setLoadingHandImage(false);
        });
      } else {
        setHandImage(hand.hand_image);
      }
    } else if (!open) {
      setFeedback('');
      setFeedbackEntries([]);
      setHandImage(null);
      setSelectedImage(null);
      setInternalHand(null);
      setInternalSessionDetails(null);
    }
  }, [open, hand?.id, currentUserId]);

  const currencySymbol = getCurrencySymbol(sessionDetails?.currency);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="p-6 space-y-6">
      <div className="flex justify-center">
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-12 w-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="text-center">
        <Skeleton className="h-4 w-20 mx-auto mb-2" />
        <Skeleton className="h-8 w-24 mx-auto" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-poker-gold">
              <Icon name="Eye" size={20} />
              Hand Review
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingData ? (
            <LoadingSkeleton />
          ) : !hand ? (
            <div className="p-6 text-center text-muted-foreground">
              <Icon name="AlertCircle" className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Hand data not available</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-6">
                {/* Image attachment at top - lazy loaded */}
                {loadingHandImage ? (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-muted text-muted-foreground">
                      <Icon name="Loader" size={20} className="animate-spin" />
                      <span>Loading image...</span>
                    </div>
                  </div>
                ) : handImage && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setSelectedImage(handImage)}
                      className="flex items-center justify-center gap-2 p-3 rounded-lg border border-muted hover:bg-muted/20 transition-colors w-full text-poker-gold"
                      aria-label="View hand screenshot"
                    >
                      <Icon name="Image" size={20} />
                      <span>View Hand Screenshot</span>
                    </button>
                  </div>
                )}

                {/* Hand details grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Hand number and position */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Hand #</span>
                      <p className="font-medium">{hand.hand_number || 'N/A'}</p>
                    </div>
                    {hand.position && (
                      <div>
                        <span className="text-sm text-muted-foreground">Position</span>
                        <p className="font-medium">{hand.position}</p>
                      </div>
                    )}
                  </div>

                  {/* Game type and stakes */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Game Type</span>
                      <p className="font-medium">{sessionDetails?.game_type || 'N/A'}</p>
                    </div>
                    {sessionDetails?.small_blind && sessionDetails?.big_blind && (
                      <div>
                        <span className="text-sm text-muted-foreground">Stakes</span>
                        <p className="font-medium">{currencySymbol}{sessionDetails.small_blind}/{currencySymbol}{sessionDetails.big_blind}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cards */}
                {hand.hole_cards && (
                  <div>
                    <span className="text-sm text-muted-foreground">Hole Cards</span>
                    <div className="mt-2">
                      <CardDisplay cards={hand.hole_cards} size="lg" />
                    </div>
                  </div>
                )}

                {/* Community cards - all 5 board cards in one row */}
                {(hand.flop_cards || hand.turn_card || hand.river_card) && (
                  <div>
                    <span className="text-sm text-muted-foreground">Board</span>
                    <div className="mt-2 flex items-center gap-2">
                      {hand.flop_cards && <CardDisplay cards={hand.flop_cards} size="md" />}
                      {hand.turn_card && <CardDisplay cards={hand.turn_card} size="md" />}
                      {hand.river_card && <CardDisplay cards={hand.river_card} size="md" />}
                    </div>
                  </div>
                )}

                {/* Financial details */}
                <div className="grid grid-cols-2 gap-4">
                  {typeof hand.pot_size === 'number' && (
                    <div>
                      <span className="text-sm text-muted-foreground">Pot Size</span>
                      <p className="font-medium">{currencySymbol}{hand.pot_size.toFixed(2)}</p>
                    </div>
                  )}
                  {typeof hand.amount_invested === 'number' && (
                    <div>
                      <span className="text-sm text-muted-foreground">Amount Invested</span>
                      <p className="font-medium">{currencySymbol}{hand.amount_invested.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {/* Action details */}
                <div className="space-y-3">
                  {hand.preflop_action && (
                    <div>
                      <span className="text-sm text-muted-foreground">Preflop Action</span>
                      <p className="mt-1 text-sm bg-muted p-2 rounded">{hand.preflop_action}</p>
                    </div>
                  )}
                  {hand.flop_action && (
                    <div>
                      <span className="text-sm text-muted-foreground">Flop Action</span>
                      <p className="mt-1 text-sm bg-muted p-2 rounded">{hand.flop_action}</p>
                    </div>
                  )}
                  {hand.turn_action && (
                    <div>
                      <span className="text-sm text-muted-foreground">Turn Action</span>
                      <p className="mt-1 text-sm bg-muted p-2 rounded">{hand.turn_action}</p>
                    </div>
                  )}
                  {hand.river_action && (
                    <div>
                      <span className="text-sm text-muted-foreground">River Action</span>
                      <p className="mt-1 text-sm bg-muted p-2 rounded">{hand.river_action}</p>
                    </div>
                  )}
                </div>

                {/* Player notes */}
                {hand.hand_notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Player Notes</span>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{hand.hand_notes}</p>
                    </div>
                  </div>
                )}

                {/* Result - emphasized at bottom */}
                <div className="border-t pt-4">
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">Hand Result</span>
                    <div className="mt-2">
                      {typeof hand.amount_won === 'number' && typeof hand.amount_invested === 'number' ? (
                        <div className="flex justify-center">
                          <ProfitLossBadge 
                            profit={hand.amount_won - hand.amount_invested}
                            currency={sessionDetails?.currency || 'USD'}
                          />
                        </div>
                      ) : hand.showdown_result ? (
                        <Badge variant="outline" className="text-base px-4 py-2">
                          {hand.showdown_result}
                        </Badge>
                      ) : (
                        <p className="text-muted-foreground">No result recorded</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coach feedback section */}
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium">Coach Feedback</span>
                    
                    {/* Display existing feedback entries */}
                    {feedbackEntries.length > 0 && (
                      <div className="mt-3 space-y-3">
                        <div className="text-sm text-muted-foreground">Previous Feedback:</div>
                        {feedbackEntries.map((entry, index) => (
                          <div key={entry.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs text-muted-foreground">
                                #{index + 1} • {new Date(entry.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <div className="flex items-center gap-1">
                                {/* Student: Toggle heart like */}
                                {!isCoach && (
                                  <button
                                    onClick={() => toggleFeedbackLike(entry)}
                                    disabled={isTogglingLike === entry.id}
                                    className="p-1.5 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50"
                                    aria-label={entry.seen_at ? "Unlike feedback" : "Like feedback"}
                                  >
                                    {isTogglingLike === entry.id ? (
                                      <Icon name="Loader" className="h-5 w-5 animate-spin text-muted-foreground" />
                                    ) : entry.seen_at ? (
                                      <Icon name="Heart" className="h-5 w-5 fill-rose-500 text-rose-500 transition-colors" />
                                    ) : (
                                      <Icon name="Heart" className="h-5 w-5 text-muted-foreground hover:text-rose-400 transition-colors" />
                                    )}
                                  </button>
                                )}
                                {/* Coach: Read-only heart indicator + Delete button */}
                                {isCoach && (
                                  <>
                                    <div 
                                      className="p-1"
                                      aria-label={entry.seen_at ? "Student liked this feedback" : "Not liked yet"}
                                    >
                                      {entry.seen_at ? (
                                        <Icon name="Heart" className="h-4 w-4 fill-rose-500 text-rose-500" />
                                      ) : (
                                        <Icon name="Heart" className="h-4 w-4 text-muted-foreground/40" />
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteFeedback(entry.id)}
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                      <Icon name="trash-2" className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{entry.feedback_content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {isCoach ? (
                      // Coach view: Input for adding new feedback
                      <>
                        <Textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Add your feedback for this hand..."
                          className="mt-3 min-h-[100px] resize-none"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button variant="outline" onClick={onClose}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={saveFeedback}
                            disabled={!feedback.trim() || isSavingFeedback}
                          >
                            {isSavingFeedback ? (
                              <>
                                <Icon name="Loader" className="h-4 w-4 animate-spin mr-2" />
                                Saving...
                              </>
                            ) : (
                              'Add Feedback'
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      // Player view: Read-only feedback display
                      <>
                        {feedbackEntries.length === 0 && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">No coach feedback yet</p>
                          </div>
                        )}
                        <div className="flex justify-end mt-3">
                          <Button variant="outline" onClick={onClose}>
                            Close
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-screen image viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            aria-label="Close image viewer"
          >
            <Icon name="X" className="h-6 w-6 text-white" />
          </button>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Hand screenshot"
              className="max-w-full max-h-[90vh] object-contain mx-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
