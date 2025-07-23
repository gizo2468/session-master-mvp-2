
import React, { useState } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { PokerSession, TableData } from '@/types/poker';
import { format } from 'date-fns';
import { DollarSign, Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import PastSessionInfoStep from './PastSessionInfoStep';
import PastSessionTablesStep from './PastSessionTablesStep';

interface AddPastSessionFormProps {
  onClose: () => void;
}

interface SessionInfo {
  startTime: Date;
  endTime: Date;
  location: string;
  notes?: string;
}

const AddPastSessionForm: React.FC<AddPastSessionFormProps> = ({ onClose }) => {
  const { addSession } = useSessionContext();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<'info' | 'tables'>('info');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    startTime: new Date(),
    endTime: new Date(),
    location: '',
    notes: ''
  });
  const [tables, setTables] = useState<TableData[]>([]);
  const [savedSession, setSavedSession] = useState<PokerSession | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSessionInfoSubmit = (info: SessionInfo) => {
    setSessionInfo(info);
    setCurrentStep('tables');
  };

  const handleAddTable = (table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => {
    const newTable: TableData = {
      ...table,
      id: uuidv4(),
      startTime: sessionInfo.startTime,
      isActive: false,
      endTime: sessionInfo.endTime,
      hands: []
    };
    setTables(prev => [...prev, newTable]);
  };

  const handleUpdateTable = (tableId: string, updatedTable: TableData) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? updatedTable : table
    ));
  };

  const handleDeleteTable = (tableId: string) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
  };

  const handleSaveSession = async () => {
    if (tables.length === 0) {
      toast({
        title: 'No Tables Added',
        description: 'Please add at least one table to save the session.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Calculate total buy-in from all tables
      const totalBuyIn = tables.reduce((sum, table) => sum + table.buyIn, 0);
      const totalCashOut = tables.reduce((sum, table) => sum + (table.cashOut || 0), 0);
      
      // Get the primary table's game details for session-level data
      const primaryTable = tables[0];
      
      // Determine if session is online if any table is online
      const isOnline = tables.some(table => table.isOnline || false);
      
      const sessionDuration = Math.round((sessionInfo.endTime.getTime() - sessionInfo.startTime.getTime()) / (1000 * 60));
      
      const newSession: PokerSession = {
        id: uuidv4(),
        gameType: primaryTable.gameType,
        format: primaryTable.format,
        location: sessionInfo.location,
        buyIn: totalBuyIn,
        initialBuyIn: totalBuyIn,
        cashOut: totalCashOut,
        smallBlind: primaryTable.smallBlind || 0,
        bigBlind: primaryTable.bigBlind || 0,
        startTime: sessionInfo.startTime,
        endTime: sessionInfo.endTime,
        isActive: false,
        isOnline,
        notes: sessionInfo.notes,
        sessionDuration,
        currentStatus: 'ended',
        hands: [],
        tables: tables
      };

      // Add to local state first
      addSession(newSession);
      
      // Store session for confirmation screen
      setSavedSession(newSession);
      
      // Then sync to Supabase if user is logged in
      if (user) {
        console.log('🔄 Syncing past session to Supabase for user:', user.id, 'Email:', user.email);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            start_time: sessionInfo.startTime.toISOString(),
            end_time: sessionInfo.endTime.toISOString(),
            session_type: primaryTable.format,
            game_type: primaryTable.gameType,
            notes: sessionInfo.notes || null,
            email: user.email // NEW: Include user email for permanent identification
            // user_id will be set automatically by DEFAULT auth.uid()
          })
          .select()
          .single();

        if (sessionError) {
          console.error('❌ Error syncing past session:', sessionError);
          toast({
            title: 'Cloud Sync Warning',
            description: 'Session saved locally but failed to sync to cloud. You can try again later.',
            variant: 'destructive'
          });
        } else {
          console.log('✅ Past session synced with ID:', sessionData.id, 'for user:', user.id, 'email:', user.email);
        }
      }
      
      // Show confirmation dialog
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error saving past session:', error);
      toast({
        title: 'Error',
        description: 'There was a problem saving your session.',
        variant: 'destructive',
      });
    }
  };

  const renderConfirmationSummary = () => {
    if (!savedSession) return null;

    const totalBuyIn = savedSession.tables?.reduce((sum, table) => sum + table.buyIn, 0) || savedSession.buyIn;
    const totalCashOut = savedSession.tables?.reduce((sum, table) => sum + (table.cashOut || 0), 0) || savedSession.cashOut || 0;
    const totalProfit = totalCashOut - totalBuyIn;
    const sessionDuration = savedSession.endTime && savedSession.startTime 
      ? Math.round((savedSession.endTime.getTime() - savedSession.startTime.getTime()) / (1000 * 60 * 60 * 24) * 24 * 60) 
      : 0;
    const hours = Math.floor(sessionDuration / 60);
    const minutes = sessionDuration % 60;

    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-xl font-bold">Session Saved Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session Name */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">{savedSession.location || 'Poker Session'}</h3>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Date</span>
            </div>
            <span className="font-medium">
              {format(savedSession.startTime, 'MMM d, yyyy')}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Time</span>
            </div>
            <span className="font-medium">
              {format(savedSession.startTime, 'h:mm a')} - {savedSession.endTime ? format(savedSession.endTime, 'h:mm a') : 'Ongoing'}
            </span>
          </div>

          {/* Duration */}
          {sessionDuration > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Duration</span>
              </div>
              <span className="font-medium">
                {hours > 0 && `${hours}h`} {minutes}m
              </span>
            </div>
          )}

          {/* Tables Played */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Tables Played ({savedSession.tables?.length || 0})</h4>
            {savedSession.tables && savedSession.tables.length > 0 ? (
              <div className="space-y-2">
                {savedSession.tables.map((table, index) => {
                  const tableProfit = (table.cashOut || 0) - table.buyIn;
                  const profitColor = tableProfit >= 0 ? 'text-green-600' : 'text-red-600';
                  
                  return (
                    <div key={table.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">Table {index + 1}</span>
                        <div className="text-xs text-muted-foreground">
                          {table.gameType} • {table.format}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          Buy-in: ${table.buyIn.toFixed(2)}
                        </Badge>
                        {table.cashOut !== undefined && (
                          <div className={`text-sm font-medium ${profitColor}`}>
                            {tableProfit >= 0 ? '+' : ''}${tableProfit.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No tables recorded
              </div>
            )}
          </div>

          {/* Total Summary */}
          {totalBuyIn > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Buy-in:</span>
                <span className="font-medium">${totalBuyIn.toFixed(2)}</span>
              </div>
              {totalCashOut > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Cash-out:</span>
                    <span className="font-medium">${totalCashOut.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Profit/Loss:</span>
                    <span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
          <header className="mb-6 md:mb-8">
            <Button 
              onClick={() => {
                if (currentStep === 'tables') {
                  setCurrentStep('info');
                } else {
                  onClose();
                }
              }} 
              variant="ghost"
              className="mb-4"
            >
              ← {currentStep === 'tables' ? 'Back to Session Info' : 'Back'}
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Add Past Session</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {currentStep === 'info' 
                ? 'Step 1: Enter session information' 
                : 'Step 2: Add tables and hands'
              }
            </p>
          </header>

          {currentStep === 'info' ? (
            <PastSessionInfoStep
              initialData={sessionInfo}
              onSubmit={handleSessionInfoSubmit}
              onCancel={onClose}
            />
          ) : (
            <PastSessionTablesStep
              sessionInfo={sessionInfo}
              tables={tables}
              onAddTable={handleAddTable}
              onUpdateTable={handleUpdateTable}
              onDeleteTable={handleDeleteTable}
              onSave={handleSaveSession}
              onBack={() => setCurrentStep('info')}
            />
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Session Confirmation</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {renderConfirmationSummary()}
            <Button 
              onClick={() => {
                setShowConfirmation(false);
                onClose();
              }}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddPastSessionForm;
