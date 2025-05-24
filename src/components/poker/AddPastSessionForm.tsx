
import React, { useState } from 'react';
import { useSessionContext } from '@/context/SessionContext';
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
  isOnline: boolean;
  isMultiDay: boolean;
  location: string;
  notes?: string;
}

const AddPastSessionForm: React.FC<AddPastSessionFormProps> = ({ onClose }) => {
  const { addSession } = useSessionContext();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<'info' | 'tables'>('info');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    startTime: new Date(),
    endTime: new Date(),
    isOnline: false,
    isMultiDay: false,
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

  const handleSaveSession = () => {
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
        isOnline: sessionInfo.isOnline,
        notes: sessionInfo.notes,
        sessionDuration,
        currentStatus: 'ended',
        hands: [],
        tables: tables
      };

      addSession(newSession);
      
      toast({
        title: 'Past Session Added',
        description: 'Your past session has been successfully recorded.',
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem saving your session.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
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
          <h1 className="text-2xl font-bold">Add Past Session</h1>
          <p className="text-gray-600">
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
