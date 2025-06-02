
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { useAuth } from '@/context/AuthContext';
import { useSessionContext } from '@/context/SessionContext';
import { loadSessionData, SessionDataResult } from '@/utils/sessionDataLoader';
import { HandData, TableData } from '@/types/poker';
import { ReviewsList } from '@/components/coaching/ReviewsList';
import { HandReviewForm } from '@/components/coaching/HandReviewForm';
import { TableReviewForm } from '@/components/coaching/TableReviewForm';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';

interface SessionViewProps {
  sessionId: string;
  onBack: () => void;
  mode: 'student' | 'coach';
  studentId?: string;
}

export const SessionView: React.FC<SessionViewProps> = ({
  sessionId,
  onBack,
  mode,
  studentId
}) => {
  const { user } = useAuth();
  const { sessions } = useSessionContext();
  const [loading, setLoading] = useState(true);
  const [sessionResult, setSessionResult] = useState<SessionDataResult | null>(null);
  const [selectedHand, setSelectedHand] = useState<HandData | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showHandReview, setShowHandReview] = useState(false);
  const [showTableReview, setShowTableReview] = useState(false);

  // Set up real-time subscriptions for reviews if in coach mode
  useRealtimeSubscriptions(
    mode === 'coach' ? [
      {
        table: 'coach_to_hand_reviews',
        event: '*',
        filter: `session_id=eq.${sessionId}`,
        callback: () => {
          console.log('🔔 Hand review updated, refreshing...');
          // Could trigger a refresh of reviews here
        }
      },
      {
        table: 'coach_to_table_reviews',
        event: '*',
        filter: `session_id=eq.${sessionId}`,
        callback: () => {
          console.log('🔔 Table review updated, refreshing...');
          // Could trigger a refresh of reviews here
        }
      }
    ] : [],
    [sessionId, mode]
  );

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId, user?.id, mode, studentId]);

  const loadSessionDetails = async () => {
    if (!user?.id) {
      setSessionResult({
        success: false,
        errorType: 'permission_denied',
        errorMessage: 'You must be logged in to view sessions.'
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('🔄 Loading session details:', { sessionId, mode, studentId });

    try {
      const result = await loadSessionData(
        sessionId,
        user.id,
        mode,
        studentId,
        sessions
      );

      console.log('📊 Session load result:', result);
      setSessionResult(result);

      if (!result.success && result.fallbackToLocal) {
        // Try to load from local storage
        const localSession = sessions.find(s => s.id === sessionId);
        if (localSession) {
          console.log('🔄 Falling back to local session data');
          // Convert local session to expected format
          setSessionResult({
            success: true,
            sessionData: {
              id: localSession.id,
              user_id: user.id,
              start_time: localSession.startTime.toISOString(),
              end_time: localSession.endTime?.toISOString(),
              session_type: localSession.format,
              game_type: localSession.gameType,
              notes: localSession.notes
            },
            tableData: localSession.tables || [],
            handData: localSession.hands || []
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading session:', error);
      setSessionResult({
        success: false,
        errorType: 'network_error',
        errorMessage: 'Failed to load session. Please check your connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHandReview = (hand: HandData) => {
    if (mode === 'coach') {
      setSelectedHand(hand);
      setShowHandReview(true);
    }
  };

  const handleTableReview = (table: TableData) => {
    if (mode === 'coach') {
      setSelectedTable(table);
      setShowTableReview(true);
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'In Progress';
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Icon name="Loader" className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Session</h3>
              <p className="text-gray-600">Retrieving session data...</p>
              <div className="mt-4 text-xs text-gray-500">
                Session ID: {sessionId.slice(0, 8)}...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionResult?.success || !sessionResult.sessionData) {
    const isNotFound = sessionResult?.errorType === 'not_found';
    const isPermissionDenied = sessionResult?.errorType === 'permission_denied';
    const isNetworkError = sessionResult?.errorType === 'network_error';

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Icon 
                name={isNotFound ? "Search" : isPermissionDenied ? "Lock" : "AlertCircle"} 
                className={`mx-auto mb-4 h-8 w-8 ${
                  isNotFound ? "text-orange-500" : 
                  isPermissionDenied ? "text-red-500" : 
                  "text-yellow-500"
                }`} 
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isNotFound ? "Session Not Found" : 
                 isPermissionDenied ? "Access Denied" : 
                 "Loading Failed"}
              </h3>
              <p className="text-gray-600 mb-4">
                {sessionResult?.errorMessage || 'Unable to load session data.'}
              </p>
              
              <div className="space-y-3">
                <Button onClick={onBack} variant="outline" className="w-full">
                  <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
                
                {isNetworkError && (
                  <Button onClick={loadSessionDetails} variant="default" className="w-full">
                    <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <div>Session ID: {sessionId}</div>
                <div>Mode: {mode}</div>
                {studentId && <div>Student ID: {studentId.slice(0, 8)}...</div>}
                <div>Error: {sessionResult?.errorType || 'unknown'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sessionData, tableData = [], handData = [] } = sessionResult;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" className="mb-4">
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {sessionData.game_type} {sessionData.session_type}
              </h1>
              <p className="text-gray-600">
                {new Date(sessionData.start_time).toLocaleDateString()} • 
                {formatDuration(sessionData.start_time, sessionData.end_time)}
              </p>
            </div>
            
            {mode === 'coach' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Icon name="UserCheck" className="mr-1 h-3 w-3" />
                Coach View
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="BarChart3" />
                  Session Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Tables</div>
                    <div className="text-2xl font-bold">{tableData.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Hands</div>
                    <div className="text-2xl font-bold">
                      {handData.length + tableData.reduce((acc, table) => acc + (table.hands?.length || 0), 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Buy-in</div>
                    <div className="text-2xl font-bold">
                      ${tableData.reduce((acc, table) => acc + table.buyIn, 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Cash-out</div>
                    <div className="text-2xl font-bold">
                      ${tableData.reduce((acc, table) => acc + table.cashOut, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                {sessionData.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Session Notes</div>
                    <div className="text-gray-900">{sessionData.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tables */}
            {tableData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Layers" />
                    Tables ({tableData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tableData.map((table) => (
                      <div key={table.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{table.name}</h4>
                            <p className="text-sm text-gray-600">
                              {table.format} • {table.gameType} • {table.stakes}
                            </p>
                          </div>
                          {mode === 'coach' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTableReview(table)}
                            >
                              <Icon name="MessageSquare" className="mr-1 h-3 w-3" />
                              Review
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Buy-in:</span> ${table.buyIn.toFixed(2)}
                          </div>
                          <div>
                            <span className="text-gray-500">Cash-out:</span> ${table.cashOut.toFixed(2)}
                          </div>
                          <div>
                            <span className="text-gray-500">P&L:</span> 
                            <span className={table.cashOut - table.buyIn >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${(table.cashOut - table.buyIn).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Hands:</span> {table.hands?.length || 0}
                          </div>
                        </div>

                        {table.hands && table.hands.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm font-medium text-gray-700 mb-2">Recent Hands</div>
                            <div className="grid gap-2">
                              {table.hands.slice(0, 3).map((hand) => (
                                <div key={hand.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      {hand.holeCards ? hand.holeCards.join(', ') : 'Hand'}
                                    </span>
                                    {hand.position && (
                                      <Badge variant="outline" className="text-xs">{hand.position}</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm ${hand.amountWon > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                      {hand.currencyType === 'currency' ? '$' : ''}{hand.amountWon}
                                    </span>
                                    {mode === 'coach' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleHandReview(hand)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Icon name="MessageSquare" className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session-Level Hands */}
            {handData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Spade" />
                    Session Hands ({handData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {handData.map((hand) => (
                      <div key={hand.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">
                              {hand.holeCards ? hand.holeCards.join(', ') : 'Hand'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {hand.position && `${hand.position} • `}
                              {hand.preflopAction && `${hand.preflopAction}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`font-medium ${hand.amountWon > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                              {hand.currencyType === 'currency' ? '$' : ''}{hand.amountWon}
                            </div>
                            {hand.potSize && (
                              <div className="text-sm text-gray-500">
                                Pot: {hand.currencyType === 'currency' ? '$' : ''}{hand.potSize}
                              </div>
                            )}
                          </div>
                          {mode === 'coach' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleHandReview(hand)}
                            >
                              <Icon name="MessageSquare" className="mr-1 h-3 w-3" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Coach Reviews */}
            <ReviewsList 
              sessionId={sessionId} 
              studentId={studentId || sessionData.user_id} 
            />
          </div>
        </div>
      </div>

      {/* Review Dialogs */}
      {selectedHand && (
        <HandReviewForm
          open={showHandReview}
          onOpenChange={setShowHandReview}
          sessionId={sessionId}
          handId={selectedHand.id}
          studentId={studentId || sessionData.user_id}
          onSuccess={() => {
            setShowHandReview(false);
            setSelectedHand(null);
          }}
        />
      )}

      {selectedTable && (
        <TableReviewForm
          open={showTableReview}
          onOpenChange={setShowTableReview}
          sessionId={sessionId}
          tableId={selectedTable.id}
          studentId={studentId || sessionData.user_id}
          onSuccess={() => {
            setShowTableReview(false);
            setSelectedTable(null);
          }}
        />
      )}
    </div>
  );
};
