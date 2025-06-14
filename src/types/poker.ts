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
  
  // New detailed hand tracking properties for Supabase sync
  handNumber?: number;
  holeCards?: string[]; // Keep existing 'cards' for backward compatibility
  preflopAction?: string;
  flopCards?: string[];
  flopAction?: string;
  turnCard?: string;
  turnAction?: string;
  riverCard?: string;
  riverAction?: string;
  showdownResult?: string; // Keep existing 'result' for backward compatibility
  potSize?: number;
  amountWon?: number;
  amountInvested?: number;
  handImage?: string; // Keep existing 'image' for backward compatibility
}

export interface TableData {
  id: string;
  name?: string;
  format: string;
  gameType: string;
  location: string;
  buyIn: number;
  initialBuyIn?: number;
  smallBlind?: number;
  bigBlind?: number;
  startingBB?: number;
  currentStack?: number;
  isActive: boolean;
  isOnline?: boolean; // Added missing property
  startTime: Date;
  startTimeUTC?: number; // Raw UTC timestamp for accurate calculations
  endTime?: Date;
  endTimeUTC?: number; // Raw UTC timestamp for accurate calculations
  cashOut?: number;
  rebuys?: number;
  rebuyAmount?: number;
  addOns?: number;
  bountyAmount?: number;
  bountyCount?: number;
  finalPosition?: number;
  notes?: string;
  session_id?: string;
  hands?: HandData[];
  tournamentBuyIn?: number;
  tournamentTypes?: string[];
  isMultiDay?: boolean;
  nextDayStart?: Date;
  chipsCarryover?: number;
  dayEndedWithoutElimination?: boolean;
}

export interface SessionData {
  id: string;
  startTime: Date;
  endTime?: Date;
  gameType: string;
  sessionType: string;
  notes?: string;
  tables: TableData[];
  user_id: string;
}

export interface PokerSession {
  id: string;
  gameType: string;
  format: string;
  location: string;
  physicalLocation?: string;
  tableName?: string;
  buyIn: number;
  initialBuyIn?: number;
  smallBlind: number;
  bigBlind: number;
  isOnline?: boolean;
  startingBB?: number;
  tournamentTypes?: string[];
  isMultiDay?: boolean;
  startTime: Date;
  startTimeUTC?: number; // Raw UTC timestamp for accurate calculations
  endTime?: Date;
  endTimeUTC?: number; // Raw UTC timestamp for accurate calculations
  cashOut?: number;
  notes?: string;
  isActive: boolean;
  currentStatus: 'running' | 'paused' | 'ended';
  status?: string; // Added missing property
  sessionDuration?: number;
  rebuys?: number;
  rebuyAmount?: number;
  addOns?: number; // Added missing property
  tournamentBuyIn?: number; // Added missing property
  roi?: number;
  itmRatioNumerator?: number;
  itmRatioDenominator?: number;
  tablesPlayed?: number;
  tables?: TableData[];
  hands?: HandData[];
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
  studentName?: string; // Added to show student name in requests
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
