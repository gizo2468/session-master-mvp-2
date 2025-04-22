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
  startingBB?: number;
}

export interface PokerSession {
  id: string;
  gameType: 'NLH' | 'PLO';
  format: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game';
  tableName?: string;
  location: string;
  initialBuyIn: number;
  buyIn: number;
  cashOut?: number;
  smallBlind: number;
  bigBlind: number;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  isActive?: boolean;
  isOnline?: boolean;
  tournamentBuyIn?: number;
  rebuys?: number;
  addOns?: number;
  finalPosition?: number;
  sessionDuration?: number;
  ploCardCount?: 4 | 5 | 6;
  currentStatus?: 'running' | 'paused' | 'ended';
  hands?: HandData[];
  tables?: TableData[];
}

export interface SessionFilter {
  gameType?: 'NLH' | 'PLO' | 'All';
  format?: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game' | 'All';
  location?: string;
}
