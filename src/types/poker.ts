
export interface PokerSession {
  id: string;
  gameType: 'NLH' | 'PLO';
  format: 'Cash' | 'Tournament';
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
}

export interface SessionFilter {
  gameType?: 'NLH' | 'PLO' | 'All';
  format?: 'Cash' | 'Tournament' | 'All';
  location?: string;
}
