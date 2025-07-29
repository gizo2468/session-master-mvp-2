import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import Icon from '@/components/ui/Lucide';
import ProfitLossBadge from '@/components/poker/ProfitLossBadge';

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
  created_at: string;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionData();
    }
  }, [isOpen, sessionId]);

  const loadSessionData = async () => {
    setLoading(true);
    try {
      // Load session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', playerId)
        .single();

      if (sessionError) {
        console.error('Error loading session details:', sessionError);
        return;
      }

      setSessionDetails(sessionData);

      // Load session hands
      const { data: handsData, error: handsError } = await supabase
        .from('session_hands_new')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', playerId)
        .order('created_at', { ascending: true });

      if (handsError) {
        console.error('Error loading session hands:', handsError);
      } else {
        setSessionHands(handsData || []);
      }
    } catch (error) {
      console.error('Error in loadSessionData:', error);
    } finally {
      setLoading(false);
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

  const calculateDuration = (session: SessionDetails) => {
    // Always prioritize calculation from start and end times for consistency
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Session Summary</TabsTrigger>
              <TabsTrigger value="hands">
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
                      <p className="font-medium">{sessionDetails.tables_played || 0}</p>
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

            <TabsContent value="hands" className="space-y-4">
              {sessionHands.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Inbox" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hands have been uploaded for this session.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionHands.map((hand, index) => (
                    <Card key={hand.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Hand #{hand.hand_number || index + 1}
                            </Badge>
                            {hand.position && (
                              <Badge variant="secondary">{hand.position}</Badge>
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
                          <div className="mb-2">
                            <span className="text-sm text-muted-foreground">Hole Cards: </span>
                            <span className="font-medium">{hand.hole_cards}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {hand.pot_size !== undefined && hand.pot_size !== null && (
                            <div>
                              <span className="text-muted-foreground">Pot: </span>
                              <span>{currencySymbol}{hand.pot_size.toFixed(0)}</span>
                            </div>
                          )}
                          {hand.amount_invested !== undefined && hand.amount_invested !== null && (
                            <div>
                              <span className="text-muted-foreground">Invested: </span>
                              <span>{currencySymbol}{hand.amount_invested.toFixed(0)}</span>
                            </div>
                          )}
                          {hand.amount_won !== undefined && hand.amount_won !== null && (
                            <div>
                              <span className="text-muted-foreground">Won: </span>
                              <span>{currencySymbol}{hand.amount_won.toFixed(0)}</span>
                            </div>
                          )}
                        </div>

                        {hand.hand_notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="text-muted-foreground">Notes: </span>
                            {hand.hand_notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
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
      </DialogContent>
    </Dialog>
  );
};