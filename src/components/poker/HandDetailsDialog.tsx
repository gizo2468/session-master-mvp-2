import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HandData } from '@/types/poker';
import CardDisplay from './CardDisplay';
import { CircleDollarSign, Image as ImageIcon, ChevronDown, Loader2 } from 'lucide-react';
import { PokerChip } from '../Icons';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { fetchHandImage } from '@/utils/database/sessionFetcher';
import { supabase } from '@/integrations/supabase/client';

interface HandDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hand: HandData | null;
  sessionBuyIn?: number;
  tables?: any[];
  onEdit?: (hand: HandData) => void;
  readOnly?: boolean;
}

const HandDetailsDialog: React.FC<HandDetailsDialogProps> = ({
  open,
  onOpenChange,
  hand,
  sessionBuyIn,
  tables = [],
  onEdit,
  readOnly = false
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [handImage, setHandImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [opponentName, setOpponentName] = useState<string | null>(null);

  // Lazy load hand image when dialog opens
  useEffect(() => {
    if (open && hand?.id && !hand.image && !hand.handImage && !handImage) {
      // Only fetch if image isn't already in hand data
      setImageLoading(true);
      fetchHandImage(hand.id)
        .then((image) => {
          setHandImage(image);
        })
        .finally(() => {
          setImageLoading(false);
        });
    } else if (hand?.image || hand?.handImage) {
      // Use existing image from hand data
      setHandImage(hand.image || hand.handImage || null);
    }
  }, [open, hand?.id, hand?.image, hand?.handImage]);

  // Fetch linked opponent name when dialog opens
  useEffect(() => {
    const fetchOpponentName = async () => {
      if (open && hand?.opponentProfileId) {
        try {
          const { data, error } = await supabase
            .from('opponent_profiles')
            .select('nickname')
            .eq('id', hand.opponentProfileId)
            .maybeSingle();
          
          if (!error && data) {
            setOpponentName(data.nickname);
          }
        } catch (error) {
          console.error('Error fetching opponent name:', error);
        }
      }
    };
    
    fetchOpponentName();
  }, [open, hand?.opponentProfileId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setHandImage(null);
      setShowImageModal(false);
      setOpponentName(null);
    }
  }, [open]);

  if (!hand) return null;

  // Find the table this hand belongs to
  const handTable = tables.find(table => table.id === hand.tableId);
  const buyIn = handTable?.buyIn || sessionBuyIn;

  // Helper to format player name with position
  const formatPlayerName = (
    playerName: string, 
    position: string | undefined, 
    heroNickname: string | undefined
  ): string => {
    const positionPrefix = position ? `(${position}) ` : '';
    
    if (playerName === 'Hero') {
      const nickname = heroNickname ? ` (${heroNickname})` : '';
      return `${positionPrefix}Hero${nickname}`;
    }
    
    return `${positionPrefix}${playerName}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hand Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Main Hand Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hand Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cards */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Cards:</span>
                <div className="flex items-center gap-2">
                  <CardDisplay cards={hand.cards} size="md" />
                  {imageLoading ? (
                    <div className="p-1.5">
                      <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    </div>
                  ) : handImage ? (
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="p-1.5 rounded hover:bg-accent transition-colors"
                      title="View hand screenshot"
                    >
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ) : null}
                </div>
              </div>
              
              {/* Position */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Position:</span>
                <Badge variant="secondary">{hand.position}</Badge>
              </div>
              
              {/* Game Type */}
              {hand.gameType && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-20">Game Type:</span>
                  <Badge variant="secondary">{hand.gameType}</Badge>
                </div>
              )}
              
              {/* Action */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Action:</span>
                <span className="text-sm">{hand.action}</span>
              </div>
              
              {/* Buy-in */}
              {buyIn !== undefined && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-20">Buy-In:</span>
                  <span className="text-sm font-medium">${buyIn.toFixed(2)}</span>
                </div>
              )}
              
              {/* Blinds */}
              {(hand.smallBlind !== undefined || hand.bigBlind !== undefined) && (hand.smallBlind || hand.bigBlind) !== 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-20">Blinds:</span>
                  <span className="text-sm">
                    {hand.currencyType === 'currency' ? '$' : ''}
                    {hand.smallBlind !== undefined ? Number(hand.smallBlind).toString() : '0'}
                    /
                    {hand.currencyType === 'currency' ? '$' : ''}
                    {hand.bigBlind !== undefined ? Number(hand.bigBlind).toString() : '0'}
                  </span>
                </div>
              )}
            
            {/* Showdown Result */}
            {hand.showdownResult && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-24">Hand Result:</span>
                <span className={`text-lg font-semibold ${
                  (hand.resultValue !== undefined && hand.resultValue >= 0) || 
                  (hand.showdownResult && hand.showdownResult.startsWith('+')) 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {hand.showdownResult}
                </span>
              </div>
            )}
            
            {/* Linked Opponent */}
            {opponentName && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-24">Played vs:</span>
                <span className="text-sm font-medium">{opponentName}</span>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Hand History with Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hand History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* All community cards in one row */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Board:</span>
                <div className="flex gap-1">
                  {hand.flopCards && hand.flopCards.length > 0 ? (
                    <CardDisplay cards={hand.flopCards.join('')} size="sm" />
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No flop</span>
                  )}
                  {hand.turnCard && (
                    <CardDisplay cards={hand.turnCard} size="sm" />
                  )}
                  {hand.riverCard && (
                    <CardDisplay cards={hand.riverCard} size="sm" />
                  )}
                  {!hand.flopCards?.length && !hand.turnCard && !hand.riverCard && (
                    <span className="text-sm text-muted-foreground italic">No data available</span>
                  )}
                </div>
              </div>

              {/* Villains */}
              {(() => {
                const villainsWithCards = (hand.villains || []).filter(v => v.hand && v.hand.trim() !== '');
                
                if (villainsWithCards.length === 0) return null;
                
                return (
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-20">Villains:</span>
                    <div className="flex flex-col gap-2">
                      {villainsWithCards.map((villain, index) => {
                        const villainLabel = villainsWithCards.length === 1 
                          ? 'Villain' 
                          : `Villain ${index + 1}`;
                        
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground min-w-[60px]">{villainLabel}:</span>
                            <CardDisplay cards={villain.hand!} size="sm" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* User-Entered Street Actions */}
              {(() => {
                const formatStructuredAction = (action: any): string => {
                  let actorDisplay = action.actor;
                  
                  // Add position if available
                  if (action.actor === 'Hero' && hand.position) {
                    actorDisplay = `Hero (${hand.position})`;
                  } else if (action.actor.startsWith('Villain')) {
                    const villainIndex = action.actor === 'Villain' ? 0 : parseInt(action.actor.split(' ')[1]) - 1;
                    const villainPosition = hand.villains?.[villainIndex]?.position;
                    if (villainPosition) {
                      actorDisplay = `${action.actor} (${villainPosition})`;
                    }
                  }
                  
                  // Format the action text
                  if (action.action === 'Other') {
                    return `${actorDisplay}: ${action.customDescription || 'Other'}`;
                  }
                  if (action.action === 'Check' || action.action === 'Fold') {
                    return `${actorDisplay}: ${action.action}`;
                  }
                  if (action.size) {
                    return `${actorDisplay}: ${action.action} ${action.size}${action.unit}`;
                  }
                  return `${actorDisplay}: ${action.action}`;
                };

                const hasFlopActions = hand.flopActions && hand.flopActions.length > 0;
                const hasTurnActions = hand.turnActions && hand.turnActions.length > 0;
                const hasRiverActions = hand.riverActions && hand.riverActions.length > 0;
                const hasAnyActions = hasFlopActions || hasTurnActions || hasRiverActions;
                
                return (
                  <div className="space-y-3">
                    <span className="text-sm font-medium text-muted-foreground">Actions:</span>
                    
                    {!hasAnyActions ? (
                      <p className="text-sm text-muted-foreground italic pl-4">
                        No actions were recorded for this hand.
                      </p>
                    ) : (
                      <div className="space-y-3 pl-4">
                        {/* Flop Actions */}
                        {hasFlopActions && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase">Flop</span>
                            <ul className="mt-1 space-y-0.5">
                              {hand.flopActions!.map((action: any, idx: number) => (
                                <li key={idx} className={`text-sm ${action.actor === 'Hero' ? 'text-yellow-600 dark:text-yellow-400 font-medium' : ''}`}>
                                  {formatStructuredAction(action)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Turn Actions */}
                        {hasTurnActions && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase">Turn</span>
                            <ul className="mt-1 space-y-0.5">
                              {hand.turnActions!.map((action: any, idx: number) => (
                                <li key={idx} className={`text-sm ${action.actor === 'Hero' ? 'text-yellow-600 dark:text-yellow-400 font-medium' : ''}`}>
                                  {formatStructuredAction(action)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* River Actions */}
                        {hasRiverActions && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase">River</span>
                            <ul className="mt-1 space-y-0.5">
                              {hand.riverActions!.map((action: any, idx: number) => (
                                <li key={idx} className={`text-sm ${action.actor === 'Hero' ? 'text-yellow-600 dark:text-yellow-400 font-medium' : ''}`}>
                                  {formatStructuredAction(action)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* AI-Detected Actions */}
              {(hand.preflopActionSequence || hand.flopActionSequence || hand.turnActionSequence || hand.riverActionSequence) && (() => {
                // Determine the last street with actions
                const streets = [
                  { name: 'preflop', actions: hand.preflopActionSequence },
                  { name: 'flop', actions: hand.flopActionSequence },
                  { name: 'turn', actions: hand.turnActionSequence },
                  { name: 'river', actions: hand.riverActionSequence }
                ];
                
                let lastStreetWithActions = -1;
                streets.forEach((street, idx) => {
                  if (street.actions && street.actions.length > 0) {
                    lastStreetWithActions = idx;
                  }
                });
                
                const shouldShowStreet = (idx: number) => idx <= lastStreetWithActions;
                
                return (
                  <div className="space-y-2">
                    {/* Preflop */}
                    {shouldShowStreet(0) && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded transition-colors">
                          <span className="text-sm font-medium">Preflop</span>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 pl-4">
                          {hand.preflopActionSequence && hand.preflopActionSequence.length > 0 ? (
                            <ul className="space-y-1 text-sm">
                              {hand.preflopActionSequence.map((action, idx) => (
                                <li 
                                  key={idx} 
                                  className={`flex items-center gap-2 ${
                                    action.player === 'Hero' 
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 -mx-2 px-2 py-1 rounded' 
                                      : ''
                                  }`}
                                >
                                  <span className={`text-muted-foreground ${action.player === 'Hero' ? 'font-medium text-yellow-700 dark:text-yellow-300' : ''}`}>
                                    {formatPlayerName(action.player, action.position, hand.heroNickname)}:
                                  </span>
                                  <span className="font-medium capitalize">{action.action}</span>
                                  {action.amount !== undefined && (
                                    <span className="text-muted-foreground">
                                      {hand.currencyType === 'currency' ? '$' : ''}{action.amount}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No actions</p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Flop */}
                    {shouldShowStreet(1) && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded transition-colors">
                          <span className="text-sm font-medium">Flop</span>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 pl-4">
                          {hand.flopActionSequence && hand.flopActionSequence.length > 0 ? (
                            <ul className="space-y-1 text-sm">
                              {hand.flopActionSequence.map((action, idx) => (
                                <li 
                                  key={idx} 
                                  className={`flex items-center gap-2 ${
                                    action.player === 'Hero' 
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 -mx-2 px-2 py-1 rounded' 
                                      : ''
                                  }`}
                                >
                                  <span className={`text-muted-foreground ${action.player === 'Hero' ? 'font-medium text-yellow-700 dark:text-yellow-300' : ''}`}>
                                    {formatPlayerName(action.player, action.position, hand.heroNickname)}:
                                  </span>
                                  <span className="font-medium capitalize">{action.action}</span>
                                  {action.amount !== undefined && (
                                    <span className="text-muted-foreground">
                                      {hand.currencyType === 'currency' ? '$' : ''}{action.amount}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No actions</p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Turn */}
                    {shouldShowStreet(2) && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded transition-colors">
                          <span className="text-sm font-medium">Turn</span>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 pl-4">
                          {hand.turnActionSequence && hand.turnActionSequence.length > 0 ? (
                            <ul className="space-y-1 text-sm">
                              {hand.turnActionSequence.map((action, idx) => (
                                <li 
                                  key={idx} 
                                  className={`flex items-center gap-2 ${
                                    action.player === 'Hero' 
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 -mx-2 px-2 py-1 rounded' 
                                      : ''
                                  }`}
                                >
                                  <span className={`text-muted-foreground ${action.player === 'Hero' ? 'font-medium text-yellow-700 dark:text-yellow-300' : ''}`}>
                                    {formatPlayerName(action.player, action.position, hand.heroNickname)}:
                                  </span>
                                  <span className="font-medium capitalize">{action.action}</span>
                                  {action.amount !== undefined && (
                                    <span className="text-muted-foreground">
                                      {hand.currencyType === 'currency' ? '$' : ''}{action.amount}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No actions</p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* River */}
                    {shouldShowStreet(3) && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded transition-colors">
                          <span className="text-sm font-medium">River</span>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 pl-4">
                          {hand.riverActionSequence && hand.riverActionSequence.length > 0 ? (
                            <ul className="space-y-1 text-sm">
                              {hand.riverActionSequence.map((action, idx) => (
                                <li 
                                  key={idx} 
                                  className={`flex items-center gap-2 ${
                                    action.player === 'Hero' 
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 -mx-2 px-2 py-1 rounded' 
                                      : ''
                                  }`}
                                >
                                  <span className={`text-muted-foreground ${action.player === 'Hero' ? 'font-medium text-yellow-700 dark:text-yellow-300' : ''}`}>
                                    {formatPlayerName(action.player, action.position, hand.heroNickname)}:
                                  </span>
                                  <span className="font-medium capitalize">{action.action}</span>
                                  {action.amount !== undefined && (
                                    <span className="text-muted-foreground">
                                      {hand.currencyType === 'currency' ? '$' : ''}{action.amount}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No actions</p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    
                    {/* Result display when hand goes to showdown */}
                    {lastStreetWithActions === 3 && hand.resultAmount !== undefined && (
                      <div className="flex items-center gap-2 pl-2 pt-2">
                        {hand.currencyType === 'currency' ? (
                          <CircleDollarSign className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <PokerChip className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        )}
                        <span className={`font-medium ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {hand.resultAmount >= 0 ? '+' : ''}
                          {hand.currencyType === 'currency' ? '$' : ''}
                          {Math.abs(hand.resultAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Hand ended note */}
                    {lastStreetWithActions >= 0 && lastStreetWithActions < 3 && (
                      <div className="space-y-2 pl-2 pt-2">
                        <p className="text-sm text-muted-foreground italic">
                          Hand ended here – no further actions.
                        </p>
                        {hand.resultAmount !== undefined && (
                          <div className="flex items-center gap-2">
                            {hand.currencyType === 'currency' ? (
                              <CircleDollarSign className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            ) : (
                              <PokerChip className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            )}
                            <span className={`font-medium ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {hand.resultAmount >= 0 ? '+' : ''}
                              {hand.currencyType === 'currency' ? '$' : ''}
                              {Math.abs(hand.resultAmount).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Notes */}
          {hand.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{hand.notes}</p>
              </CardContent>
            </Card>
          )}
          
        </div>

        <DialogFooter className="flex gap-2">
          {onEdit && (
            <Button 
              variant="outline" 
              onClick={() => {
                if (hand) {
                  onEdit(hand);
                  onOpenChange(false);
                }
              }}
            >
              Edit
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img 
              src={handImage || ''} 
              alt="Hand screenshot" 
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
          <Button 
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4"
            variant="secondary"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default HandDetailsDialog;