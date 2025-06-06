
import { PokerSession, SessionFilter, HandData, TableData } from '@/types/poker';

export interface SessionContextType {
  sessions: PokerSession[];
  activeSession: PokerSession | null;
  filters: SessionFilter;
  showStorageWarning: boolean;
  dismissStorageWarning: () => void;
  addSession: (session: PokerSession) => void;
  updateSession: (session: PokerSession) => void;
  deleteSession: (id: string) => void;
  startSession: (session: PokerSession) => void;
  endSession: (id: string, cashOut: number, notes?: string) => void;
  pauseSession: (id: string) => void;
  resumeSession: (id: string) => void;
  updateSessionDuration: (id: string, duration: number) => void;
  addRebuy: (id: string, amount: number) => void;
  setFilters: (filters: SessionFilter) => void;
  addHand: (sessionId: string, hand: Omit<HandData, 'id' | 'createdAt'>) => void;
  updateHand: (sessionId: string, hand: HandData) => void;
  deleteHand: (sessionId: string, handId: string) => void;
  addTableHand: (sessionId: string, tableId: string, hand: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => void;
  updateTableHand: (sessionId: string, tableId: string, hand: HandData) => void;
  deleteTableHand: (sessionId: string, tableId: string, handId: string) => void;
  addTable: (sessionId: string, table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => void;
  updateTable: (sessionId: string, table: TableData) => void;
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
  ) => void;
  addTableRebuy: (sessionId: string, tableId: string, amount: number) => void;
  getTableById: (sessionId: string, tableId: string) => TableData | undefined;
  deleteTable: (sessionId: string, tableId: string) => void;
  clearAllUserData: () => void;
}

export const MAX_STORED_SESSIONS = 50;
