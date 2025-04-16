
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
  tableId?: string; // New field to associate a hand with a specific table
}

export interface PokerTable {
  id: string;
  name: string;
  gameType: 'NLH' | 'PLO';
  format: 'Cash' | 'Tournament';
  buyIn: number;
  initialBuyIn: number;
  cashOut?: number;
  smallBlind: number;
  bigBlind: number;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  isActive: boolean;
  
  // Tournament specific fields
  tournamentBuyIn?: number;
  rebuys?: number;
  addOns?: number;
  finalPosition?: number;
  
  // Hand tracking
  hands?: HandData[];
}

export interface PokerSession {
  id: string;
  location: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  notes?: string;
  
  // Tables within this session
  tables: PokerTable[];
}

export interface SessionFilter {
  gameType?: 'NLH' | 'PLO' | 'All';
  format?: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game' | 'All';
  location?: string;
}
