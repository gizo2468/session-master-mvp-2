
export interface HandData {
  id: string;
  cards: string;
  position: string;
  action: string;
  notes?: string;
  result?: number | string;
  resultAmount?: number;
  currencyType?: 'currency' | 'chips';
  smallBlind?: number;
  bigBlind?: number;
  image?: string;
  pokercraftLink?: string;
  createdAt: Date;
}

export interface TableData {
  id: string;
  name: string;
  format: 'Cash' | 'Tournament';
  gameType: 'NLH' | 'PLO';
  location: string;
  buyIn: number;
  initialBuyIn: number;
  cashOut?: number;
  smallBlind: number;
  bigBlind: number;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  rebuys?: number;
  addOns?: number;
  tournamentBuyIn?: number;
  notes?: string;
  finalPosition?: number;
}

export interface PokerSession {
  id: string;
  gameType: 'NLH' | 'PLO';
  format: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game';
  tableName?: string; // <-- Added tableName for session-level
  location: string;
  initialBuyIn: number; // Initial buy-in amount
  buyIn: number;        // Total buy-in amount (initial + rebuys + addons)
  cashOut?: number; // Only set when session ends
  smallBlind: number;
  bigBlind: number;
  startTime: Date;
  endTime?: Date; // Only set when session ends
  notes?: string;
  isActive?: boolean;
  isOnline?: boolean; // Added for online vs live tracking
  
  // Tournament specific fields
  tournamentBuyIn?: number;
  rebuys?: number;
  addOns?: number;
  finalPosition?: number;
  
  // Live session specific fields
  sessionDuration?: number; // In minutes
  ploCardCount?: 4 | 5 | 6; // For PLO variants
  currentStatus?: 'running' | 'paused' | 'ended';
  
  // Hand tracking
  hands?: HandData[];

  // Multi-table support
  tables?: TableData[];
}

export interface SessionFilter {
  gameType?: 'NLH' | 'PLO' | 'All';
  format?: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game' | 'All';
  location?: string;
}
