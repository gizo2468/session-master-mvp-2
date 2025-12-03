import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import Icon from '@/components/ui/Lucide';
import ProfitLossBadge from '@/components/poker/ProfitLossBadge';
import { useSessionStats } from '@/hooks/useSessionStats';
import CardDisplay from '@/components/poker/CardDisplay';
import { useToast } from '@/hooks/use-toast';
import { BBStackUpdateService } from '@/services/bbStackUpdateService';
import { HandReviewModal } from '@/components/coaching/HandReviewModal';

interface SessionDetails {
  id: string;
  game_type: string;
  format: string;
  location?: string;
  physical_location?: string;
  table_name?: string;
  buy_in: number;
  cash_out?: number;
  start_time: string;
  end_time?: string;
  is_active: boolean;
  tables_played: number;
  currency?: string;
  notes?: string;
  rebuys?: number;
  rebuy_amount?: number;
  small_blind?: number;
  big_blind?: number;
  roi?: number;
  session_duration?: number;
}

interface SessionHand {
  id: string;
  table_id?: string;
  hand_number?: number;
  pot_size?: number;
  amount_invested?: number;
  amount_won?: number;
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
  created_at: string;
}

interface SessionTable {
  id: string;
  table_name?: string;
  table_type?: string;
  game_format?: string;
  stakes?: string;
  buy_in?: number;
  cashout?: number;
  rebuys?: number;
  rebuy_amount?: number;
  bounty_amount?: number;
  players_eliminated?: number;
  final_position?: number;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
  table_notes?: string;
}

interface SharedSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  playerId: string;
}

export const SharedSessionModal: React.FC<SharedSessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  playerId
}) => {
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [sessionHands, setSessionHands] = useState<SessionHand[]>([]);
  const [sessionTables, setSessionTables] = useState<SessionTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveDuration, setLiveDuration] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviewHandId, setReviewHandId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [tableBBUpdates, setTableBBUpdates] = useState<Map<string, any>>(new Map());
  const [reviewHandImage, setReviewHandImage] = useState<string | null>(null);
  const [loadingHandImage, setLoadingHandImage] = useState(false);
  
  const { toast } = useToast();
  
  // Use the same stats calculation as the SessionCard
  const { stats } = useSessionStats(sessionId, sessionDetails as any);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionData();
    }
  }, [isOpen, sessionId]);

  // Set up real-time subscription for BB/Stack updates
  useEffect(() => {
    if (!isOpen || !sessionId || !isCoach) return;

    const channel = supabase
      .channel(`bb_stack_updates_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_bb_stack_updates',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Refetch BB/Stack updates when changes occur
          loadBBStackUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, sessionId, isCoach]);

  const loadSessionData = async () => {
    setLoading(true);
    try {
      // First, get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Get session details first
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        console.error('Error loading session details:', sessionError);
        return;
      }

      // Check if current user has access to this session
      const isSessionOwner = sessionData.user_id === user.id;
      
      if (!isSessionOwner) {
        // If not the session owner, verify this session is shared with current user as coach
        const { data: sharedSession } = await supabase
          .from('shared_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .eq('coach_id', user.id)
          .single();

        if (!sharedSession) {
          console.error('User does not have access to this session');
          return;
        }
      }

      setSessionDetails(sessionData);
      setCurrentUserId(user.id);
      setIsCoach(!isSessionOwner); // If not session owner, then must be coach

      // Always use the session owner's user_id for fetching hands and tables
      const sessionOwnerId = sessionData.user_id;

      // Fetch hands, tables, and BB/Stack updates in parallel for performance
      // Note: hand_image excluded from initial query - lazy loaded on demand
      const [handsResult, tablesResult, bbStackUpdates] = await Promise.all([
        supabase
          .from('session_hands_new')
          .select('id, table_id, hand_number, pot_size, amount_invested, amount_won, position, hole_cards, preflop_action, flop_cards, flop_action, turn_card, turn_action, river_card, river_action, showdown_result, hand_notes, created_at')
          .eq('session_id', sessionId)
          .eq('user_id', sessionOwnerId)
          .order('created_at', { ascending: true }),
        supabase
          .from('session_tables')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', sessionOwnerId)
          .order('start_time', { ascending: true }),
        !isSessionOwner 
          ? BBStackUpdateService.getLatestBBStackForSharedSession(sessionId) 
          : Promise.resolve(new Map())
      ]);

      if (handsResult.error) {
        console.error('Error loading session hands:', handsResult.error);
      } else {
        setSessionHands(handsResult.data || []);
      }

      if (tablesResult.error) {
        console.error('Error loading session tables:', tablesResult.error);
      } else {
        setSessionTables(tablesResult.data || []);
      }

      if (!isSessionOwner) {
        setTableBBUpdates(bbStackUpdates);
      }
    } catch (error) {
      console.error('Error in loadSessionData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lazy load hand image on demand
  const loadHandImage = async (handId: string): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from('session_hands_new')
        .select('hand_image')
        .eq('id', handId)
        .single();
      return data?.hand_image || null;
    } catch (error) {
      console.error('Error loading hand image:', error);
      return null;
    }
  };

  const loadBBStackUpdates = async () => {
    if (!sessionId) return;
    
    try {
      const updates = await BBStackUpdateService.getLatestBBStackForSharedSession(sessionId);
      setTableBBUpdates(updates);
    } catch (error) {
      console.error('Error loading BB/Stack updates:', error);
    }
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'USD':
      default: return '$';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate live elapsed time for active sessions
  const calculateLiveElapsedTime = useCallback((startTime: string) => {
    const start = new Date(startTime);
    const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60)); // in minutes
    return Math.max(0, elapsed);
  }, []);

  // Set up live timer for active sessions
  useEffect(() => {
    if (!sessionDetails || !sessionDetails.is_active || !sessionDetails.start_time) {
      setLiveDuration(null);
      return;
    }

    // Calculate initial live duration
    const initialDuration = calculateLiveElapsedTime(sessionDetails.start_time);
    setLiveDuration(initialDuration);

    // Update live duration every minute for active sessions
    const timer = setInterval(() => {
      const currentDuration = calculateLiveElapsedTime(sessionDetails.start_time);
      setLiveDuration(currentDuration);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [sessionDetails, calculateLiveElapsedTime]);

  const calculateDuration = (session: SessionDetails) => {
    // For live sessions, use the live duration
    if (session.is_active && liveDuration !== null) {
      return liveDuration;
    }
    
    // For ended sessions, prioritize calculation from start and end times
    if (session.start_time && session.end_time) {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    }
    
    // Fall back to stored duration if start/end times are not available
    if (session.session_duration) {
      return session.session_duration;
    }
    
    return null;
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateTableDuration = (table: SessionTable) => {
    if (table.start_time && table.end_time) {
      const start = new Date(table.start_time);
      const end = new Date(table.end_time);
      return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    }
    return null;
  };

  const calculateTableProfit = (table: SessionTable) => {
    const totalBuyIn = (table.buy_in || 0) + (table.rebuy_amount || 0);
    const totalCashOut = (table.cashout || 0) + ((table.bounty_amount || 0) * (table.players_eliminated || 0));
    return totalCashOut - totalBuyIn;
  };

  // Helper function to get table number for a hand
  const getTableNumber = (tableId?: string): number | null => {
    if (!tableId) return null;
    const tableIndex = sessionTables.findIndex(table => table.id === tableId);
    return tableIndex !== -1 ? tableIndex + 1 : null;
  };

  // Load hand image when hand is selected for review
  useEffect(() => {
    if (reviewHandId) {
      // Lazy load hand image
      setLoadingHandImage(true);
      setReviewHandImage(null);
      loadHandImage(reviewHandId).then(image => {
        setReviewHandImage(image);
        setLoadingHandImage(false);
      });
    } else {
      setReviewHandImage(null);
    }
  }, [reviewHandId]);

  const profit = sessionDetails ? (sessionDetails.cash_out || 0) - sessionDetails.buy_in : 0;
  const currencySymbol = getCurrencySymbol(sessionDetails?.currency);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="FileText" size={20} />
            Session Summary
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader" className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading session data...</span>
          </div>
        ) : sessionDetails ? (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="summary" className="text-center justify-center">Summary</TabsTrigger>
              <TabsTrigger value="tables" className="text-center justify-center">Tables</TabsTrigger>
              <TabsTrigger value="hands" className="text-center justify-center">
                Hands ({sessionHands.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              {/* Session Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{sessionDetails.game_type}</span>
                      <Badge variant="outline">{sessionDetails.format}</Badge>
                      {sessionDetails.is_active && (
                        <Badge variant="default">Live</Badge>
                      )}
                    </div>
                    {!sessionDetails.is_active && sessionDetails.cash_out !== undefined && (
                      <ProfitLossBadge 
                        profit={profit} 
                        currency={sessionDetails.currency || 'USD'}
                      />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Buy-in</p>
                      <p className="font-medium">{currencySymbol}{(sessionDetails.buy_in || 0).toFixed(0)}</p>
                    </div>
                    {sessionDetails.cash_out !== undefined && sessionDetails.cash_out !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">Cash Out</p>
                        <p className="font-medium">{currencySymbol}{sessionDetails.cash_out.toFixed(0)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(calculateDuration(sessionDetails))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tables</p>
                      <p className="font-medium">{stats.tables}</p>
                    </div>
                  </div>


                  {sessionDetails.location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{sessionDetails.location}</p>
                    </div>
                  )}

                  {sessionDetails.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{sessionDetails.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tables" className="space-y-4">
              {sessionTables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Table" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tables have been opened for this session.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionTables.map((table, index) => (
                    <Card key={table.id}>
                      <CardContent className="p-4">
                        {/* Mobile-friendly header layout */}
                         <div className="space-y-3">
                           {/* Badges row */}
                             <div className="flex flex-wrap items-center gap-2">
                               <Badge variant="outline">
                                 Table #{index + 1}
                               </Badge>
                               {table.game_format && (
                                 <Badge variant="outline">{table.game_format}</Badge>
                               )}
                               {table.is_active && (
                                 <Badge variant="default">Active</Badge>
                               )}
                             </div>
                           
                         </div>

                        {/* Buy-in and Cash Out side by side */}
                        <div className="flex gap-6 mt-2 text-sm">
                          {table.buy_in !== undefined && table.buy_in !== null && (
                            <div>
                              <span className="text-muted-foreground">Buy-in: </span>
                              <span className="font-medium">{currencySymbol}{(() => {
                                // Display original buy-in only (total buy-in divided by 1 + number of rebuys)
                                const totalRebuys = table.rebuys || 0;
                                const originalBuyIn = totalRebuys > 0 ? table.buy_in / (1 + totalRebuys) : table.buy_in;
                                return originalBuyIn.toFixed(0);
                              })()}</span>
                            </div>
                          )}
                          {table.cashout !== undefined && table.cashout !== null && (
                            <div>
                              <span className="text-muted-foreground">Cash Out: </span>
                              <span className="font-medium">{currencySymbol}{table.cashout.toFixed(0)}</span>
                            </div>
                          )}
                         </div>

                         {/* Level/BB badge centered below Buy-in/Cash Out */}
                         {isCoach && tableBBUpdates.has(table.id) && (() => {
                           const update = tableBBUpdates.get(table.id);
                           const formattedUpdate = BBStackUpdateService.formatHistoryLine(update);
                           return formattedUpdate ? (
                             <div className="flex justify-center mt-3">
                               <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                 {formattedUpdate}
                               </Badge>
                             </div>
                           ) : null;
                         })()}

                        {/* Other financial info grid */}
                        {table.rebuys !== undefined && table.rebuys > 0 && (
                          <div className="bg-muted/50 p-2 rounded mt-4 text-sm">
                            <span className="text-muted-foreground block">Rebuys</span>
                            <span className="font-medium">{table.rebuys} ({currencySymbol}{(() => {
                              // Calculate total rebuy amount: original buy-in × number of rebuys
                              const totalRebuys = table.rebuys || 0;
                              const originalBuyIn = totalRebuys > 0 ? table.buy_in / (1 + totalRebuys) : table.buy_in;
                              const totalRebuyAmount = originalBuyIn * totalRebuys;
                              return totalRebuyAmount.toFixed(0);
                            })()})</span>
                          </div>
                        )}


                        {table.stakes && (
                          <div className="text-sm mb-2">
                            <span className="text-muted-foreground">Stakes: </span>
                            <span>{table.stakes}</span>
                          </div>
                        )}

                        {sessionDetails.format === 'Tournament' && (
                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            {table.final_position !== undefined && table.final_position !== null && (
                              <div>
                                <span className="text-muted-foreground">Position: </span>
                                <span>{table.final_position}</span>
                              </div>
                            )}
                            {table.players_eliminated !== undefined && table.players_eliminated > 0 && (
                              <div>
                                <span className="text-muted-foreground">Bounties: </span>
                                <span>{table.players_eliminated} ({currencySymbol}{((table.bounty_amount || 0) * table.players_eliminated).toFixed(0)})</span>
                              </div>
                            )}
                          </div>
                        )}

                        {table.table_notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="text-muted-foreground">Notes: </span>
                            {table.table_notes}
                          </div>
                        )}

                        {/* Centered profit/loss badge at bottom */}
                        {table.cashout !== undefined && table.buy_in !== undefined && (
                          <div className="flex justify-center mt-4">
                            <ProfitLossBadge 
                              profit={calculateTableProfit(table)}
                              currency={sessionDetails.currency || 'USD'}
                              size="sm"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hands" className="space-y-4">
              {sessionHands.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Inbox" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hands have been uploaded for this session.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionHands.map((hand, index) => {
                    const tableNumber = getTableNumber(hand.table_id);
                    
                    return (
                      <Card key={hand.id}>
                        <CardContent 
                          className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                          onClick={() => setReviewHandId(hand.id)}
                        >
                           <div className="flex justify-between items-start mb-3">
                             <div className="flex items-center gap-2">
                               <Badge variant="outline">
                                 Hand #{hand.hand_number || index + 1}
                               </Badge>
                               {tableNumber && (
                                 <Badge variant="outline" className="opacity-60">
                                   Table #{tableNumber}
                                 </Badge>
                               )}
                               {hand.position && (
                                 <Badge variant="secondary">{hand.position}</Badge>
                               )}
                             {hand.hand_image && (
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setSelectedImage(hand.hand_image || null);
                                 }}
                                 className="flex items-center gap-1 p-1 rounded hover:bg-muted transition-colors"
                                 aria-label="View hand screenshot"
                               >
                                 <Icon name="Image" size={16} className="text-muted-foreground hover:text-foreground" />
                               </button>
                             )}
                           </div>
                          <div className="text-right">
                            {hand.amount_won !== undefined && hand.amount_invested !== undefined && (
                              <ProfitLossBadge 
                                profit={(hand.amount_won || 0) - (hand.amount_invested || 0)}
                                currency={sessionDetails.currency || 'USD'}
                                size="sm"
                              />
                            )}
                          </div>
                        </div>

                        {hand.hole_cards && (
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Cards:</span>
                            <CardDisplay cards={hand.hole_cards} size="sm" />
                          </div>
                        )}


                        {hand.hand_notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="text-muted-foreground">Notes: </span>
                            {hand.hand_notes}
                          </div>
                        )}
                       </CardContent>
                     </Card>
                   );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="AlertCircle" className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Failed to load session data.</p>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <DialogHeader className="p-4">
                <DialogTitle className="flex items-center gap-2">
                  <Icon name="Image" size={20} />
                  Hand Screenshot
                </DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <img
                  src={selectedImage}
                  alt="Hand screenshot"
                  className="w-full h-auto max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    console.error('Failed to load image:', selectedImage);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Hand Review Modal - uses reusable component */}
        {reviewHandId && (() => {
          const hand = sessionHands.find(h => h.id === reviewHandId);
          return (
            <HandReviewModal
              open={!!reviewHandId}
              onClose={() => setReviewHandId(null)}
              hand={hand ? {
                id: hand.id,
                hand_number: hand.hand_number,
                position: hand.position,
                hole_cards: hand.hole_cards,
                preflop_action: hand.preflop_action,
                flop_cards: hand.flop_cards,
                flop_action: hand.flop_action,
                turn_card: hand.turn_card,
                turn_action: hand.turn_action,
                river_card: hand.river_card,
                river_action: hand.river_action,
                showdown_result: hand.showdown_result,
                hand_notes: hand.hand_notes,
                hand_image: reviewHandImage || undefined,
                pot_size: hand.pot_size,
                amount_invested: hand.amount_invested,
                amount_won: hand.amount_won
              } : null}
              sessionDetails={sessionDetails ? {
                game_type: sessionDetails.game_type,
                currency: sessionDetails.currency,
                small_blind: sessionDetails.small_blind,
                big_blind: sessionDetails.big_blind
              } : null}
              playerId={playerId}
              coachId={isCoach ? currentUserId || undefined : undefined}
              isCoach={isCoach}
            />
          );
        })()}
      </DialogContent>
    </Dialog>
  );
};