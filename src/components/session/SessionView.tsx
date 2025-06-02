
import React, { useState, useEffect } from 'react';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import SessionTimeBadge from '@/components/poker/SessionTimeBadge';
import HandManagementPanel from '@/components/poker/HandManagementPanel';
import TableDetailsCard from '@/components/poker/TableDetailsCard';
import { TableReviewForm } from '@/components/coaching/TableReviewForm';
import { HandReviewForm } from '@/components/coaching/HandReviewForm';
import { ReviewsList } from '@/components/coaching/ReviewsList';
import { supabase } from '@/integrations/supabase/client';

interface SessionData {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  game_type: string | null;
  session_type: string | null;
  notes: string | null;
  created_at: string;
}

interface SessionTable {
  id: string;
  session_id: string;
  table_name: string | null;
  table_type: string | null;
  game_format: string | null;
  stakes: string | null;
  buy_in: number;
  starting_stack: number | null;
  current_stack: number | null;
  rebuys: number;
  rebuy_amount: number;
  bounty_amount: number;
  players_eliminated: number;
  final_position: number | null;
  cashout: number;
  table_notes: string | null;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
}

interface SessionHand {
  id: string;
  session_id: string;
  table_id: string | null;
  hand_number: number | null;
  hole_cards: string | null;
  position: string | null;
  preflop_action: string | null;
  flop_cards: string | null;
  flop_action: string | null;
  turn_card: string | null;
  turn_action: string | null;
  river_card: string | null;
  river_action: string | null;
  showdown_result: string | null;
  pot_size: number;
  amount_won: number;
  amount_invested: number;
  hand_notes: string | null;
  currency_type: string;
  created_at: string;
}

interface SessionResult {
  id: string;
  session_id: string;
  total_buy_in: number;
  total_cashout: number;
  net_profit: number;
  total_rebuys: number;
  total_rebuy_amount: number;
  total_bounties_earned: number;
  players_eliminated: number;
  final_position: number | null;
  tournament_entries: number;
  hours_played: number;
  hands_played: number;
  big_blinds_won: number;
  roi_percentage: number;
}

interface SessionViewProps {
  sessionId: string;
  studentId?: string; // Present when in coach mode
  onBack: () => void;
  mode: 'student' | 'coach';
}

export const SessionView: React.FC<SessionViewProps> = ({ 
  sessionId, 
  studentId, 
  onBack, 
  mode 
}) => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [sessionTables, setSessionTables] = useState<SessionTable[]>([]);
  const [sessionHands, setSessionHands] = useState<SessionHand[]>([]);
  const [sessionResults, setSessionResults] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTableReview, setShowTableReview] = useState(false);
  const [showHandReview, setShowHandReview] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedHandId, setSelectedHandId] = useState<string | null>(null);

  useEffect(() => {
    loadSessionData();
    
    // Set up real-time subscriptions for live updates
    const channels = [
      supabase
        .channel(`session-${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`
        }, () => loadSessionData())
        .subscribe(),
      
      supabase
        .channel(`session-tables-${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'session_tables',
          filter: `session_id=eq.${sessionId}`
        }, () => loadSessionData())
        .subscribe(),
        
      supabase
        .channel(`session-hands-${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'session_hands',
          filter: `session_id=eq.${sessionId}`
        }, () => loadSessionData())
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const targetUserId = studentId || sessionData?.user_id;
      
      // Load basic session info
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', targetUserId || '')
        .single();

      if (sessionError) {
        console.error('Error loading session:', sessionError);
        setError('Failed to load session data');
        return;
      }

      if (!session) {
        setError('Session not found');
        return;
      }

      setSessionData(session);

      // Load session tables
      const { data: tables, error: tablesError } = await supabase
        .from('session_tables')
        .select('*')
        .eq('session_id', sessionId)
        .order('start_time', { ascending: true });

      if (!tablesError) {
        setSessionTables(tables || []);
      }

      // Load session hands
      const { data: hands, error: handsError } = await supabase
        .from('session_hands')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!handsError) {
        setSessionHands(hands || []);
      }

      // Load session results
      const { data: results, error: resultsError } = await supabase
        .from('session_results')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (!resultsError && results) {
        setSessionResults(results);
      }
      
    } catch (error) {
      console.error('Error in loadSessionData:', error);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount: number, currencyType: string = 'currency') => {
    if (currencyType === 'chips') {
      return `${amount.toLocaleString()} chips`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const handleTableReview = (tableId: string) => {
    setSelectedTableId(tableId);
    setShowTableReview(true);
  };

  const handleHandReview = (handId: string) => {
    setSelectedHandId(handId);
    setShowHandReview(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-12">
            <Icon name="Loader" className="mx-auto mb-4 h-8 w-8 animate-spin text-poker-feltGreen" />
            <p className="text-gray-600">Loading session data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <header className="mb-8">
            <Button 
              onClick={onBack} 
              variant="ghost" 
              className="text-poker-feltGreen mb-4 flex items-center p-0 hover:bg-transparent"
            >
              ← Back
            </Button>
          </header>
          
          <div className="text-center py-12">
            <Icon name="AlertCircle" className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Session not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              The session data could not be loaded or does not exist.
            </p>
            <Button onClick={onBack} variant="poker">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            className="text-poker-feltGreen mb-4 flex items-center p-0 hover:bg-transparent"
          >
            ← Back
          </Button>
          
          <h1 className="text-2xl font-bold text-poker-black">
            {mode === 'coach' ? 'Session Review' : 'Session Details'}
          </h1>
          {mode === 'coach' && (
            <p className="text-gray-500 text-sm mt-1">
              {sessionData.game_type || 'Poker'} {sessionData.session_type || 'Session'}
            </p>
          )}
        </header>
        
        <div className="space-y-6">
          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="clock" />
                <span>Session Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-row flex-wrap gap-4 mb-6">
                <SessionTimeBadge
                  title="Started"
                  value={`${format(new Date(sessionData.start_time), 'MMM d, yyyy')}\n${format(new Date(sessionData.start_time), 'h:mm a')}`}
                  variant="timeStarted"
                  type="started"
                />
                
                <SessionTimeBadge
                  title="Duration"
                  value={formatDuration(sessionData.start_time, sessionData.end_time)}
                  variant="timeDuration"
                  type="duration"
                />
                
                <SessionTimeBadge
                  title="Ended"
                  value={`${format(new Date(sessionData.end_time), 'MMM d, yyyy')}\n${format(new Date(sessionData.end_time), 'h:mm a')}`}
                  variant="timeEnded"
                  type="ended"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Game Type</h4>
                  <p className="text-gray-600">{sessionData.game_type || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Session Type</h4>
                  <p className="text-gray-600">{sessionData.session_type || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Created</h4>
                  <p className="text-gray-600">{formatDateTime(sessionData.created_at)}</p>
                </div>
              </div>
              
              {sessionData.notes && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{sessionData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Results Summary */}
          {sessionResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="TrendingUp" />
                  <span>Session Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${sessionResults.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${sessionResults.net_profit.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Net Profit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-poker-feltGreen">${sessionResults.total_buy_in.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Total Buy-in</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-poker-feltGreen">${sessionResults.total_cashout.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Total Cashout</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-poker-feltGreen">{sessionResults.hands_played}</div>
                    <div className="text-xs text-gray-500">Hands Played</div>
                  </div>
                </div>
                
                {sessionResults.roi_percentage !== 0 && (
                  <div className="mt-4 pt-3 border-t text-center">
                    <div className={`text-lg font-medium ${sessionResults.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ROI: {sessionResults.roi_percentage.toFixed(1)}%
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Session Tables */}
          {sessionTables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="Grid" />
                  <span>Tables ({sessionTables.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessionTables.map(table => (
                    <div key={table.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {table.table_name || `Table ${table.id.slice(0, 8)}`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {table.table_type} • {table.game_format} • {table.stakes}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-medium ${(table.cashout - table.buy_in) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(table.cashout - table.buy_in) >= 0 ? '+' : ''}${(table.cashout - table.buy_in).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">P&L</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">${table.buy_in.toFixed(2)}</div>
                          <div className="text-gray-500">Buy-in</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">${table.cashout.toFixed(2)}</div>
                          <div className="text-gray-500">Cashout</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{table.rebuys}</div>
                          <div className="text-gray-500">Rebuys</div>
                        </div>
                        {table.final_position && (
                          <div>
                            <div className="font-medium text-gray-900">{table.final_position}</div>
                            <div className="text-gray-500">Position</div>
                          </div>
                        )}
                        {table.players_eliminated > 0 && (
                          <div>
                            <div className="font-medium text-gray-900">{table.players_eliminated}</div>
                            <div className="text-gray-500">Eliminations</div>
                          </div>
                        )}
                        {table.bounty_amount > 0 && (
                          <div>
                            <div className="font-medium text-gray-900">${table.bounty_amount.toFixed(2)}</div>
                            <div className="text-gray-500">Bounties</div>
                          </div>
                        )}
                      </div>
                      
                      {table.table_notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{table.table_notes}</p>
                        </div>
                      )}

                      {mode === 'coach' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                          <Button 
                            onClick={() => handleTableReview(table.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Icon name="message-square" size={14} />
                            <span>Review Table</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Hands */}
          {sessionHands.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="Cards" />
                  <span>Notable Hands ({sessionHands.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessionHands.map(hand => (
                    <div key={hand.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Hand #{hand.hand_number || 'N/A'}
                            {hand.position && (
                              <span className="ml-2 text-sm text-gray-600">({hand.position})</span>
                            )}
                          </h4>
                          {hand.hole_cards && (
                            <p className="text-sm text-gray-600">
                              Hole cards: {hand.hole_cards}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-medium ${hand.amount_won >= hand.amount_invested ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(hand.amount_won - hand.amount_invested, hand.currency_type)}
                          </div>
                          <div className="text-xs text-gray-500">Net</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatCurrency(hand.pot_size, hand.currency_type)}
                          </div>
                          <div className="text-gray-500">Pot Size</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatCurrency(hand.amount_invested, hand.currency_type)}
                          </div>
                          <div className="text-gray-500">Invested</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatCurrency(hand.amount_won, hand.currency_type)}
                          </div>
                          <div className="text-gray-500">Won</div>
                        </div>
                        {hand.showdown_result && (
                          <div>
                            <div className="font-medium text-gray-900">{hand.showdown_result}</div>
                            <div className="text-gray-500">Result</div>
                          </div>
                        )}
                      </div>

                      {/* Hand action breakdown */}
                      {(hand.preflop_action || hand.flop_action || hand.turn_action || hand.river_action) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs font-medium text-gray-700 mb-2">Action:</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {hand.preflop_action && <div><span className="font-medium">Preflop:</span> {hand.preflop_action}</div>}
                            {hand.flop_cards && hand.flop_action && (
                              <div><span className="font-medium">Flop ({hand.flop_cards}):</span> {hand.flop_action}</div>
                            )}
                            {hand.turn_card && hand.turn_action && (
                              <div><span className="font-medium">Turn ({hand.turn_card}):</span> {hand.turn_action}</div>
                            )}
                            {hand.river_card && hand.river_action && (
                              <div><span className="font-medium">River ({hand.river_card}):</span> {hand.river_action}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {hand.hand_notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{hand.hand_notes}</p>
                        </div>
                      )}

                      {mode === 'coach' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                          <Button 
                            onClick={() => handleHandReview(hand.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Icon name="message-square" size={14} />
                            <span>Review Hand</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews section for coach mode */}
          {mode === 'coach' && (
            <ReviewsList 
              sessionId={sessionId}
              studentId={studentId!}
            />
          )}

          {/* Hand Management Panel for student mode */}
          {mode === 'student' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <HandManagementPanel 
                sessionId={sessionId} 
                hands={sessionHands}
              />
            </div>
          )}
          
          {/* Placeholder for when no detailed data exists */}
          {sessionTables.length === 0 && sessionHands.length === 0 && !sessionResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="info" />
                  <span>Additional Session Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Icon name="Database" className="mx-auto mb-3 h-8 w-8" />
                  <p className="text-sm">
                    No additional session data (hands, tables, results) has been recorded yet.
                  </p>
                  <p className="text-xs mt-2 text-gray-400">
                    When detailed session information is recorded, it will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Review Forms */}
        {mode === 'coach' && selectedTableId && (
          <TableReviewForm
            open={showTableReview}
            onOpenChange={setShowTableReview}
            sessionId={sessionId}
            tableId={selectedTableId}
            studentId={studentId!}
            onSuccess={() => {
              setShowTableReview(false);
              setSelectedTableId(null);
            }}
          />
        )}

        {mode === 'coach' && selectedHandId && (
          <HandReviewForm
            open={showHandReview}
            onOpenChange={setShowHandReview}
            sessionId={sessionId}
            handId={selectedHandId}
            studentId={studentId!}
            onSuccess={() => {
              setShowHandReview(false);
              setSelectedHandId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
