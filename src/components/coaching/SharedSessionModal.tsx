import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';
import SessionDetailsCard from '@/components/poker/SessionDetailsCard';
import HandsList from '@/components/poker/HandsList';
import { PokerSession, HandData, TableData } from '@/types/poker';
import { format } from 'date-fns';

interface SharedSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  playerName: string;
}

const SharedSessionModal: React.FC<SharedSessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  playerName,
}) => {
  const [session, setSession] = useState<PokerSession | null>(null);
  const [hands, setHands] = useState<HandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionData();
    }
  }, [isOpen, sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);

      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error loading session:', sessionError);
        toast({
          title: "Error",
          description: "Failed to load session details.",
          variant: "destructive",
        });
        return;
      }

      // Fetch tables for this session
      const { data: tablesData, error: tablesError } = await supabase
        .from('session_tables')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (tablesError) {
        console.error('Error loading tables:', tablesError);
      }

      // Fetch hands for this session
      const { data: handsData, error: handsError } = await supabase
        .from('session_hands_new')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (handsError) {
        console.error('Error loading hands:', handsError);
      }

      // Transform session data to match PokerSession interface
      const tables: TableData[] = (tablesData || []).map(table => ({
        id: table.id,
        name: table.table_name || '',
        format: (sessionData.format === 'Cash' || sessionData.format === 'Tournament') ? sessionData.format as 'Cash' | 'Tournament' : 'Cash',
        gameType: (sessionData.game_type === 'NLH' || sessionData.game_type === 'PLO') ? sessionData.game_type as 'NLH' | 'PLO' : 'NLH',
        location: sessionData.location || '',
        buyIn: table.buy_in || 0,
        initialBuyIn: table.buy_in || 0,
        cashOut: table.cashout || undefined,
        startTime: new Date(table.start_time || table.created_at),
        endTime: table.end_time ? new Date(table.end_time) : undefined,
        isActive: table.is_active || false,
        rebuys: table.rebuys || 0,
        rebuyAmount: table.rebuy_amount || 0,
        bountyAmount: table.bounty_amount || 0,
        finalPosition: table.final_position || undefined,
        currentStack: table.current_stack || undefined,
        notes: table.table_notes || '',
        hands: [],
        isMultiDay: false,
        dayEndedWithoutElimination: false,
      }));

      // Transform hands data
      const transformedHands: HandData[] = (handsData || []).map(hand => ({
        id: hand.id,
        sessionId: hand.session_id,
        tableId: hand.table_id || undefined,
        handNumber: hand.hand_number || undefined,
        cards: hand.hole_cards || '',
        position: hand.position || '',
        action: [
          hand.preflop_action,
          hand.flop_action,
          hand.turn_action,
          hand.river_action
        ].filter(Boolean).join(' | ') || 'No action recorded',
        resultAmount: hand.amount_won || 0,
        potSize: hand.pot_size || 0,
        amountInvested: hand.amount_invested || 0,
        createdAt: new Date(hand.created_at || new Date()),
        currencyType: (hand.currency_type === 'currency' || hand.currency_type === 'chips') ? hand.currency_type as 'currency' | 'chips' : 'currency',
        notes: hand.hand_notes || '',
        image: hand.hand_image || undefined,
        pokercraftLink: '', // Not available in current schema
        smallBlind: sessionData.small_blind || undefined,
        bigBlind: sessionData.big_blind || undefined,
      }));

      const transformedSession: PokerSession = {
        id: sessionData.id,
        startTime: new Date(sessionData.start_time),
        endTime: sessionData.end_time ? new Date(sessionData.end_time) : undefined,
        buyIn: sessionData.buy_in || 0,
        initialBuyIn: sessionData.initial_buy_in || sessionData.buy_in || 0,
        cashOut: sessionData.cash_out || undefined,
        smallBlind: sessionData.small_blind || 0,
        bigBlind: sessionData.big_blind || 0,
        rebuys: sessionData.rebuys || 0,
        rebuyAmount: sessionData.rebuy_amount || 0,
        sessionDuration: sessionData.session_duration || 0,
        isActive: sessionData.is_active || false,
        isOnline: sessionData.is_online || false,
        startingBB: sessionData.starting_bb || undefined,
        isMultiDay: sessionData.is_multi_day || false,
        roi: sessionData.roi || 0,
        itmRatioNumerator: sessionData.itm_ratio_numerator || 0,
        itmRatioDenominator: sessionData.itm_ratio_denominator || 0,
        tablesPlayed: sessionData.tables_played || 0,
        notes: sessionData.notes || '',
        status: sessionData.status || 'active',
        currentStatus: (['running', 'paused', 'ended'].includes(sessionData.current_status)) ? sessionData.current_status as 'running' | 'paused' | 'ended' : 'running',
        gameType: (['NLH', 'PLO'].includes(sessionData.game_type)) ? sessionData.game_type as 'NLH' | 'PLO' : 'NLH',
        format: (['Cash', 'Tournament', 'Live Cash', 'Live Tournament', 'Online Cash', 'Online Tournament', 'Home Game'].includes(sessionData.format)) ? 
          sessionData.format as 'Cash' | 'Tournament' | 'Live Cash' | 'Live Tournament' | 'Online Cash' | 'Online Tournament' | 'Home Game' : 'Cash',
        location: sessionData.location || '',
        physicalLocation: sessionData.physical_location || '',
        tableName: sessionData.table_name || '',
        tournamentTypes: sessionData.tournament_types || [],
        currency: sessionData.currency || 'USD',
        tables: tables,
        hands: transformedHands,
      };

      setSession(transformedSession);
      setHands(transformedHands);
    } catch (error) {
      console.error('Error in loadSessionData:', error);
      toast({
        title: "Error",
        description: "Something went wrong loading session data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSessionDateTime = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'MMM d, yyyy • h:mm a');
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'USD':
      default: return '$';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="FileText" size={20} />
            <span>{playerName}'s Session Details</span>
            {session && (
              <Badge variant="outline" className="ml-2">
                {formatSessionDateTime(session.startTime)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader" className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading session details...</span>
          </div>
        ) : session ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Session Summary</TabsTrigger>
              <TabsTrigger value="hands" className="flex items-center gap-2">
                <span>Hands</span>
                {hands.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {hands.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <SessionDetailsCard session={session} />
              
              {session.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="StickyNote" size={18} />
                      Session Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{session.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="hands" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon name="Layout" size={18} />
                    <span>Hands Played</span>
                    <Badge variant="secondary">{hands.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hands.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="Inbox" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hands have been recorded for this session.</p>
                    </div>
                  ) : (
                    <HandsList
                      hands={hands}
                      onEditHand={() => {}} // Read-only view
                      onDeleteHand={() => {}} // Read-only view
                      readOnly={true}
                      sessionBuyIn={session.buyIn}
                      tables={session.tables}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="AlertCircle" className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Failed to load session details.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SharedSessionModal;