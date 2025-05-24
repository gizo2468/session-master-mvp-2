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
  gameType?: 'NLH' | 'PLO';
  tableId?: string; // Optional to support legacy hands
}

export interface TableData {
  id: string;
  name?: string;
  format: 'Cash' | 'Tournament';
  gameType: 'NLH' | 'PLO';
  location: string;
  buyIn: number;
  initialBuyIn: number;
  cashOut?: number;
  smallBlind?: number;
  bigBlind?: number;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  isOnline?: boolean;
  rebuys?: number;
  addOns?: number;
  tournamentBuyIn?: number;
  notes?: string;
  finalPosition?: number;
  startingBB?: number;
  bountyCount?: number;
  bountyAmount?: number;
  tournamentTypes?: string[];
  isMultiDay?: boolean;
  nextDayStart?: Date;
  chipsCarryover?: number;
  dayEndedWithoutElimination?: boolean;
  hands?: HandData[];
}

export interface PokerSession {
  id: string;
  gameType: 'NLH' | 'PLO';
  format: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game';
  tableName?: string;
  location: string;
  physicalLocation?: string;
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
  currentStatus?: 'running' | 'paused' | 'ended';

  hands?: HandData[];
  tables?: TableData[];
}

export interface SessionFilter {
  gameType?: 'NLH' | 'PLO' | 'All';
  format?: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game' | 'All';
  location?: string;
}

// Coach-student connection feature types
export interface CoachProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  activeCode?: ConnectionCode;
  students: string[]; // Array of student IDs
  createdAt: Date;
  comments?: CoachComment[]; // New field for comments
}

export interface StudentProfile {
  id: string;
  userId: string;
  displayName: string;
  coachId?: string; // ID of the connected coach, if any
  createdAt: Date;
  lastActivity?: Date; // Track last activity time
  sessionCount?: number; // Count of saved sessions
}

export interface ConnectionCode {
  id: string;
  code: string;
  coachId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ConnectionRequest {
  id: string;
  coachId: string;
  studentId: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: Date;
}

// New types for coaching features
export type CommentTag = 
  'common_mistake' | 
  'aggressive_play' | 
  'good_decision' | 
  'needs_review';

export interface CoachComment {
  id: string;
  coachId: string;
  studentId: string;
  sessionId: string;
  handId?: string; // Optional - if commenting on a specific hand
  content: string;
  tag?: CommentTag;
  createdAt: Date;
  status: 'unread' | 'read' | 'implemented' | 'needs_clarification';
}

export interface StudentActivity {
  studentId: string;
  isLive: boolean;
  lastSessionId?: string;
  lastSessionTime?: Date;
}

// New types for coach tier system
export type UserRole = 'student' | 'coach';

export type CoachTier = 'free' | 'starter' | 'pro' | 'elite';

export interface CoachTierDetails {
  name: string;
  tier: CoachTier;
  price: number;
  maxStudents: number;
  features: string[];
}
