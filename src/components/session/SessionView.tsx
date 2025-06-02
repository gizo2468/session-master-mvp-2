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
import { useAuth } from '@/context/AuthContext';
import { HandData } from '@/types/poker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

type ErrorType = 'session_not_found' | 'permission_denied' | 'network_error' | 'invalid_user' | 'unknown';

interface ErrorState {
  type: ErrorType;
  message: string;
  details?: string;
}

// Helper function to convert SessionHand to HandData
const convertSessionHandsToHandData = (sessionHands: SessionHand[]): HandData[] => {
  return sessionHands.map(hand => ({
    id: hand.id,
    cards: hand.hole_cards || '',
    position: hand.position || '',
    action: hand.preflop_action || '',
    notes: hand.hand_notes,
    result: hand.showdown_result,
    resultAmount: hand.amount_won,
    currencyType: hand.currency_type as 'currency' | 'chips',
    createdAt: new Date(hand.created_at),
    tableId: hand.table_id || undefined,
    handNumber: hand.hand_number || undefined,
    holeCards: hand.hole_cards ? [hand.hole_cards] : undefined,
    preflopAction: hand.preflop_action || undefined,
    flopCards: hand.flop_cards ? [hand.flop_cards] : undefined,
    flopAction: hand.flop_action || undefined,
    turnCard: hand.turn_card || undefined,
    turnAction: hand.turn_action || undefined,
    riverCard: hand.river_card || undefined,
    riverAction: hand.river_action || undefined,
    showdownResult: hand.showdown_result || undefined,
    potSize: hand.pot_size,
    amountWon: hand.amount_won,
    amountInvested: hand.amount_invested,
    handImage: undefined
  }));
};

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
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [showTableReview, setShowTableReview] = useState(false);
  const [showHandReview, setShowHandReview] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedHandId, setSelectedHandId] = useState<string | null>(null);
  const { user } = useAuth();

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
      setErrorState(null);
      
      console.log('🔍 Starting session load process:', { sessionId, mode, studentId, userId: user?.id });
      
      // Step 1: Validate we have required user context
      if (mode === 'coach' && !studentId) {
        console.error('❌ Coach mode requires studentId');
        setErrorState({
          type: 'invalid_user',
          message: 'Invalid coach session access',
          details: 'Student ID is required for coach mode'
        });
        return;
      }
      
      if (mode === 'student' && !user?.id) {
        console.error('❌ Student mode requires authenticated user');
        setErrorState({
          type: 'invalid_user',
          message: 'Authentication required',
          details: 'Please log in to view your sessions'
        });
        return;
      }
      
      // Step 2: First check if session exists at all (regardless of user)
      console.log('🔍 Step 1: Checking if session exists:', sessionId);
      const { data: sessionExists, error: existsError } = await supabase
        .from('sessions')
        .select('id, user_id')
        .eq('id', sessionId)
        .single();

      if (existsError) {
        console.error('❌ Error checking session existence:', existsError);
        if (existsError.code === 'PGRST116') {
          // No rows returned - session doesn't exist
          setErrorState({
            type: 'session_not_found',
            message: 'Session not found',
            details: `The session with ID ${sessionId} does not exist in the database`
          });
          return;
        } else {
          // Other database error
          setErrorState({
            type: 'network_error',
            message: 'Database connection error',
            details: 'Unable to connect to the database. Please try again.'
          });
          return;
        }
      }

      console.log('✅ Session exists:', sessionExists);
      
      // Step 3: Determine the correct user ID for permission check
      let targetUserId: string;
      if (mode === 'coach' && studentId) {
        targetUserId = studentId;
        console.log('🔍 Coach mode: Loading session for student ID:', studentId);
      } else if (mode === 'student' && user?.id) {
        targetUserId = user.id;
        console.log('🔍 Student mode: Loading session for user ID:', user.id);
      } else {
        // This shouldn't happen due to validation above, but safety check
        setErrorState({
          type: 'invalid_user',
          message: 'Invalid user context',
          details: 'Unable to determine the correct user for session access'
        });
        return;
      }
      
      // Step 4: Check if user has permission to access this session
      if (sessionExists.user_id !== targetUserId) {
        console.error('❌ Permission denied:', { 
          sessionOwner: sessionExists.user_id, 
          requestingUser: targetUserId,
          mode 
        });
        
        setErrorState({
          type: 'permission_denied',
          message: mode === 'coach' ? 'Student session not accessible' : 'Access denied',
          details: mode === 'coach' 
            ? 'This session does not belong to your student or you do not have permission to view it'
            : 'You do not have permission to view this session'
        });
        return;
      }
      
      // Step 5: Load the full session data
      console.log('🔍 Step 2: Loading full session data');
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', targetUserId)
        .single();

      if (sessionError || !session) {
        console.error('❌ Error loading full session data:', sessionError);
        setErrorState({
          type: 'network_error',
          message: 'Failed to load session details',
          details: 'Error retrieving complete session information'
        });
        return;
      }

      console.log('✅ Session loaded successfully:', session);
      setSessionData(session);

      // Step 6: Load related data (tables, hands, results)
      console.log('🔍 Step 3: Loading session tables');
      const { data: tables, error: tablesError } = await supabase
        .from('session_tables')
        .select('*')
        .eq('session_id', sessionId)
        .order('start_time', { ascending: true });

      if (!tablesError) {
        setSessionTables(tables || []);
        console.log('✅ Tables loaded:', tables?.length || 0);
      } else {
        console.error('❌ Error loading tables:', tablesError);
      }

      console.log('🔍 Step 4: Loading session hands');
      const { data: hands, error: handsError } = await supabase
        .from('session_hands')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!handsError) {
        setSessionHands(hands || []);
        console.log('✅ Hands loaded:', hands?.length || 0);
      } else {
        console.error('❌ Error loading hands:', handsError);
      }

      console.log('🔍 Step 5: Loading session results');
      const { data: results, error: resultsError } = await supabase
        .from('session_results')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (!resultsError && results) {
        setSessionResults(results);
        console.log('✅ Results loaded:', results);
      } else if (resultsError && resultsError.code !== 'PGRST116') {
        console.error('❌ Error loading results:', resultsError);
      } else {
        console.log('ℹ️ No session results found (this is normal for some sessions)');
      }
      
    } catch (error) {
      console.error('❌ Unexpected error in loadSessionData:', error);
      setErrorState({
        type: 'unknown',
        message: 'Unexpected error occurred',
        details: 'An unexpected error occurred while loading the session'
      });
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

  const renderErrorState = (error: ErrorState) => {
    const getErrorIcon = (type: ErrorType) => {
      switch (type) {
        case 'session_not_found':
          return 'Search';
        case 'permission_denied':
          return 'Lock';
        case 'network_error':
          return 'Wifi';
        case 'invalid_user':
          return 'User';
        default:
          return 'AlertCircle';
      }
    };

    const getErrorActions = (type: ErrorType) => {
      switch (type) {
        case 'session_not_found':
          return (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={onBack} variant="poker">
                Go Back to Sessions
              </Button>
              <Button 
                onClick={() => window.location.href = '/history'} 
                variant="outline"
              >
                View Session History
              </Button>
            </div>
          );
        case 'permission_denied':
          return (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={onBack} variant="poker">
                Go Back
              </Button>
              {mode === 'coach' && (
                <Button 
                  onClick={() => window.location.href = '/coach-dashboard'} 
                  variant="outline"
                >
                  Coach Dashboard
                </Button>
              )}
            </div>
          );
        case 'invalid_user':
          return (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => window.location.href = '/auth/login'} 
                variant="poker"
              >
                Sign In
              </Button>
              <Button onClick={onBack} variant="outline">
                Go Back
              </Button>
            </div>
          );
        default:
          return (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => loadSessionData()} variant="poker">
                Try Again
              </Button>
              <Button onClick={onBack} variant="outline">
                Go Back
              </Button>
            </div>
          );
      }
    };

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
            <Icon name={getErrorIcon(error.type)} className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error.message}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {error.details}
            </p>
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <Alert className="mb-6 max-w-md mx-auto text-left">
                <AlertTitle>Debug Info</AlertTitle>
                <AlertDescription className="text-xs font-mono">
                  Session ID: {sessionId}<br />
                  Mode: {mode}<br />
                  Student ID: {studentId || 'N/A'}<br />
                  User ID: {user?.id || 'N/A'}<br />
                  Error Type: {error.type}
                </AlertDescription>
              </Alert>
            )}
            
            {getErrorActions(error.type)}
          </div>
        </div>
      </div>
    );
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

  if (errorState) {
    return renderErrorState(errorState);
  }

  if (!sessionData) {
    return renderErrorState({
      type: 'unknown',
      message: 'Unexpected error',
      details: 'Session data is not available'
    });
  }

  // Convert SessionHand[] to HandData[] for HandManagementPanel
  const handDataForPanel = convertSessionHandsToHandData(sessionHands);

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
                  <Icon name="Layers" />
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
                  <Icon name="Spade" />
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
                hands={handDataForPanel}
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
