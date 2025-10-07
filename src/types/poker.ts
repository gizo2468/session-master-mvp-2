export interface HandData {
  id: string;
  supabaseId?: string; // CRITICAL FIX: Add supabaseId for database operations
  sessionId?: string;
  tableId?: string;
  handNumber?: number;
  position?: string;
  cards?: string;
  action?: string;
  holeCards?: string[];
  preflopAction?: string;
  flopCards?: string[];
  flopAction?: string;
  turnCard?: string;
  turnAction?: string;
  riverCard?: string;
  riverAction?: string;
  // Multi-villain support
  villains?: Array<{
    hand?: string;
    bigBlind?: number;
    position?: string;
  }>;
  // Legacy single villain fields (for backward compatibility)
  villainHand?: string;
  villainBigBlind?: number;
  villainPosition?: string;
  showdownResult?: string;
  result?: string | number;
  resultAmount?: number;
  potSize?: number;
  amountInvested?: number;
  amountWon?: number;
  notes?: string;
  image?: string;
  handImage?: string;
  currencyType?: 'currency' | 'chips';
  smallBlind?: number; // Added back for form and display components
  bigBlind?: number; // Added back for form and display components
  pokercraftLink?: string; // Added back for video link functionality
  gameType?: 'NLH' | 'PLO'; // Added back for game type selection
  createdAt: Date;
}

export interface TableData {
  id: string;
  name?: string;
  format: 'Cash' | 'Tournament'; // More specific typing
  gameType: 'NLH' | 'PLO'; // More specific typing
  location: string;
  buyIn: number;
  initialBuyIn?: number;
  currency?: string; // Currency code (e.g., 'USD', 'EUR', 'ILS')
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
  gameType: 'NLH' | 'PLO'; // More specific typing
  format: 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game'; // More specific typing
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
  currency?: string; // Currency code (e.g., 'USD', 'EUR', 'ILS')
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
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
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

// AI Hand Analysis Types
export interface AICardDetection {
  rank: string;
  suit: string;
  confidence: number; // 0-1
}

export interface AIPlayerDetection {
  position: string; // UTG|MP|CO|BTN|SB|BB|UNKNOWN
  cards: AICardDetection[] | 'hidden';
  stack: number;
  stackUnit: 'chips' | 'BB';
  confidence: number;
}

export interface AIDealerButtonDetection {
  position: string | null;
  confidence: number;
  requiresManualSelection: boolean;
}

export interface AIBoardDetection {
  flop: AICardDetection[] | null;
  turn: AICardDetection | null;
  river: AICardDetection | null;
  confidence: number;
}

export interface AIActionDetection {
  street: 'preflop' | 'flop' | 'turn' | 'river';
  description: string;
  actions: Array<{
    player: string;
    action: string;
    amount?: number;
    confidence: number;
  }>;
}

export interface AIGameContextDetection {
  gameType: 'NLH' | 'PLO' | 'PLO5' | 'UNKNOWN';
  format: 'cash' | 'tournament' | 'unknown';
  blindLevel: { sb: number; bb: number } | null;
  confidence: number;
}

export interface AIHandAnalysisResult {
  gameContext: AIGameContextDetection;
  hero: AIPlayerDetection;
  dealerButton: AIDealerButtonDetection;
  villains: AIPlayerDetection[];
  board: AIBoardDetection;
  actions: AIActionDetection[];
  pot: { size: number; unit: 'chips' | 'BB'; confidence: number };
  result: {
    outcome: 'win' | 'loss' | 'split' | 'unknown';
    amount: number;
    unit: 'chips' | 'BB';
    summary: string;
    confidence: number;
  };
  metadata: {
    heroOverrideAvailable: boolean;
    warnings: string[];
    processingTimeMs: number;
  };
}

export interface AIAnalyzerState {
  status: 'idle' | 'uploading' | 'analyzing' | 'needsDealerSelection' | 'success' | 'error' | 'unsupportedFormat';
  image: string | null;
  imageSize: number;
  analysis: AIHandAnalysisResult | null;
  error: string | null;
  manualOverrides: {
    heroPosition?: string;
    dealerPosition?: string;
  };
}
