
import { PokerSession, SessionFilter, HandData, TableData } from '@/types/poker';

export interface SessionContextType {
  sessions: PokerSession[];
  activeSession: PokerSession | null;
  filters: SessionFilter;
  showStorageWarning: boolean;
  isLoading: boolean;
  dismissStorageWarning: () => void;
  addSession: (session: PokerSession) => Promise<void>;
  updateSession: (session: PokerSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  startSession: (session: PokerSession) => Promise<PokerSession>;
  endSession: (id: string, cashOut: number, notes?: string) => Promise<void>;
  pauseSession: (id: string) => Promise<void>;
  resumeSession: (id: string) => Promise<void>;
  updateSessionDuration: (id: string, duration: number) => Promise<void>;
  addRebuy: (id: string, amount: number) => Promise<void>;
  setFilters: (filters: SessionFilter) => void;
  addHand: (sessionId: string, hand: Omit<HandData, 'id' | 'createdAt'>) => Promise<void>;
  updateHand: (sessionId: string, hand: HandData) => Promise<void>;
  deleteHand: (sessionId: string, handId: string) => Promise<void>;
  addTableHand: (sessionId: string, tableId: string, hand: Omit<HandData, 'id' | 'createdAt'>) => Promise<void>;
  updateTableHand: (sessionId: string, tableId: string, hand: HandData) => Promise<void>;
  deleteTableHand: (sessionId: string, tableId: string, handId: string) => Promise<void>;
  addTable: (sessionId: string, table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => Promise<void>;
  updateTable: (sessionId: string, table: TableData) => Promise<void>;
  endTable: (
    sessionId: string, 
    tableId: string, 
    cashOut: number, 
    notes?: string,
    bounty?: { 
      bountyCount?: number, 
      bountyAmount?: number,
      finalPosition?: number 
    },
    multiDayInfo?: {
      nextDayStart?: Date,
      chipsCarryover?: number,
      dayEndedWithoutElimination?: boolean
    }
  ) => Promise<void>;
  addTableRebuy: (sessionId: string, tableId: string, amount: number) => Promise<void>;
  getTableById: (sessionId: string, tableId: string) => TableData | undefined;
  deleteTable: (sessionId: string, tableId: string) => Promise<void>;
  clearAllUserData: () => void;
  refreshSessionsFromDatabase?: () => Promise<void>;
}
