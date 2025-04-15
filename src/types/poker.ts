
export interface PokerSession {
  id: string;
  gameType: 'NLH' | 'PLO';
  format: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game';
  location: string;
  buyIn: number;
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
}

export interface SessionFilter {
  gameType?: 'NLH' | 'PLO' | 'All';
  format?: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game' | 'All';
  location?: string;
}
