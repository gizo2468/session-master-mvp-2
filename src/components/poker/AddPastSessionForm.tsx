
import React, { useState } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { PokerSession, TableData } from '@/types/poker';
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
      } else {
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving past session:', error);
      toast({
        title: 'Error',
        description: 'There was a problem saving your session.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-background">
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
  );
};

export default AddPastSessionForm;
