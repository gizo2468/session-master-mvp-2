
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';

interface SessionHand {
  id: string;
  hand_number: number | null;
  position: string | null;
  hole_cards: string | null;
  pot_size: number;
  amount_won: number;
  amount_invested: number;
  showdown_result: string | null;
  currency_type: string;
  preflop_action: string | null;
  flop_action: string | null;
  turn_action: string | null;
  river_action: string | null;
  hand_notes: string | null;
}

interface HandSelectionListProps {
  sessionId: string;
  selectedHandIds: string[];
  onSelectionChange: (handIds: string[]) => void;
}

export const HandSelectionList = ({ sessionId, selectedHandIds, onSelectionChange }: HandSelectionListProps) => {
  const [hands, setHands] = useState<SessionHand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionHands();
  }, [sessionId]);

  const loadSessionHands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('session_hands')
        .select('*')
        .eq('session_id', sessionId)
        .order('hand_number', { ascending: true });

      if (error) {
        console.error('Error loading session hands:', error);
        return;
      }

      setHands(data || []);
    } catch (error) {
      console.error('Error in loadSessionHands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHandToggle = (handId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedHandIds, handId]);
    } else {
      onSelectionChange(selectedHandIds.filter(id => id !== handId));
    }
  };

  const formatCurrency = (amount: number, currencyType: string = 'currency') => {
    if (currencyType === 'chips') {
      return `${amount.toLocaleString()} chips`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const getNetResult = (hand: SessionHand) => {
    return hand.amount_won - hand.amount_invested;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <Icon name="Loader" className="mx-auto mb-2 h-6 w-6 animate-spin" />
            <p>Loading hands...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hands.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <Icon name="Cards" className="mx-auto mb-2 h-8 w-8" />
            <p>No hands recorded for this session.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="Cards" size={20} />
          <span>Select Hands to Associate with Review</span>
          {selectedHandIds.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedHandIds.length} selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {hands.map(hand => {
            const isSelected = selectedHandIds.includes(hand.id);
            const netResult = getNetResult(hand);
            
            return (
              <div 
                key={hand.id} 
                className={`border rounded-lg p-3 transition-colors ${
                  isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleHandToggle(hand.id, checked as boolean)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm">
                          Hand #{hand.hand_number || 'N/A'}
                          {hand.position && (
                            <span className="ml-2 text-xs text-gray-600">({hand.position})</span>
                          )}
                        </h4>
                        {hand.hole_cards && (
                          <p className="text-xs text-gray-600 mt-1">
                            Hole cards: {hand.hole_cards}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {netResult >= 0 ? '+' : ''}{formatCurrency(netResult, hand.currency_type)}
                        </div>
                        <div className="text-xs text-gray-500">Net</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Pot:</span> {formatCurrency(hand.pot_size, hand.currency_type)}
                      </div>
                      <div>
                        <span className="text-gray-500">Invested:</span> {formatCurrency(hand.amount_invested, hand.currency_type)}
                      </div>
                      <div>
                        <span className="text-gray-500">Won:</span> {formatCurrency(hand.amount_won, hand.currency_type)}
                      </div>
                    </div>
                    
                    {hand.hand_notes && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {hand.hand_notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
