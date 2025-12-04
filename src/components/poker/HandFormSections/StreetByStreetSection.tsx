import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { CircleHelp, ChevronDown, Trash2, Plus, X } from 'lucide-react';
import { Control, UseFormSetValue, useFieldArray } from 'react-hook-form';
import { useIsMobile } from '@/hooks/use-mobile';
import HandDetailGate from '@/components/ui/HandDetailGate';
import CardSlotPicker from '../CardSlotPicker';
import { FormValues, positions } from '@/utils/handFormHelpers';

interface StreetByStreetSectionProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  selectedCards: string;
  gameType: string;
  isFlopOpen: boolean;
  setIsFlopOpen: (open: boolean) => void;
  isTurnOpen: boolean;
  setIsTurnOpen: (open: boolean) => void;
  isRiverOpen: boolean;
  setIsRiverOpen: (open: boolean) => void;
  isShowdownOpen: boolean;
  setIsShowdownOpen: (open: boolean) => void;
  flopCards: any[];
  turnCards: any[];
  riverCards: any[];
  villains: any[];
}

const StreetByStreetSection: React.FC<StreetByStreetSectionProps> = ({
  control,
  setValue,
  selectedCards,
  gameType,
  isFlopOpen,
  setIsFlopOpen,
  isTurnOpen,
  setIsTurnOpen,
  isRiverOpen,
  setIsRiverOpen,
  isShowdownOpen,
  setIsShowdownOpen,
  flopCards,
  turnCards,
  riverCards,
  villains
}) => {
  const isMobile = useIsMobile();
  
  // Use field array for dynamic villain management
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'villains'
  });

  return (
        <HandDetailGate>
          <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Street-by-Street</h3>
          <AdaptiveTooltip content="Analyze the action through each betting round">
            <CircleHelp className="h-4 w-4 text-gray-500" />
          </AdaptiveTooltip>
        </div>
        
        {/* Showdown Result - Collapsible */}
        <Collapsible open={isShowdownOpen} onOpenChange={setIsShowdownOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
              <span>Showdown Result</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isShowdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-4">
              {/* Board Cards Display */}
              <div>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Board</FormLabel>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('flopCards', [{ id: 0 }, { id: 1 }, { id: 2 }]);
                      setValue('turnCards', [{ id: 0 }]);
                      setValue('riverCards', [{ id: 0 }]);
                    }}
                    className="text-gray-500 hover:text-gray-800 ml-2"
                    aria-label="Clear all board cards"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Flop Cards */}
                  {flopCards?.filter(c => c.rank && c.suit).map((card, index) => (
                    <div key={`flop-${index}`} className="w-12 h-16 relative">
                      <div className="w-full h-full bg-white border border-gray-200 rounded flex flex-col items-center justify-between p-1">
                        <div className="font-bold text-sm">{card.rank}</div>
                        <div className={`${card.suit === 'h' || card.suit === 'd' ? 'text-red-600' : 'text-black'} text-lg`}>
                          {card.suit === 'h' ? '♥' : card.suit === 'd' ? '♦' : card.suit === 's' ? '♠' : '♣'}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Turn Card */}
                  {turnCards?.filter(c => c.rank && c.suit).map((card, index) => (
                    <div key={`turn-${index}`} className="w-12 h-16 relative">
                      <div className="w-full h-full bg-white border border-gray-200 rounded flex flex-col items-center justify-between p-1">
                        <div className="font-bold text-sm">{card.rank}</div>
                        <div className={`${card.suit === 'h' || card.suit === 'd' ? 'text-red-600' : 'text-black'} text-lg`}>
                          {card.suit === 'h' ? '♥' : card.suit === 'd' ? '♦' : card.suit === 's' ? '♠' : '♣'}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* River Card */}
                  {riverCards?.filter(c => c.rank && c.suit).map((card, index) => (
                    <div key={`river-${index}`} className="w-12 h-16 relative">
                      <div className="w-full h-full bg-white border border-gray-200 rounded flex flex-col items-center justify-between p-1">
                        <div className="font-bold text-sm">{card.rank}</div>
                        <div className={`${card.suit === 'h' || card.suit === 'd' ? 'text-red-600' : 'text-black'} text-lg`}>
                          {card.suit === 'h' ? '♥' : card.suit === 'd' ? '♦' : card.suit === 's' ? '♠' : '♣'}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show placeholder cards for remaining slots if no cards entered */}
                  {(!flopCards?.some(c => c.rank && c.suit) && !turnCards?.some(c => c.rank && c.suit) && !riverCards?.some(c => c.rank && c.suit)) && (
                    <>
                      {Array.from({ length: 5 }, (_, index) => (
                        <div key={`placeholder-${index}`} className="w-12 h-16">
                          <div className="w-full h-full bg-yellow-400 rounded border-2 border-white relative overflow-hidden">
                            <div 
                              className="absolute inset-0 opacity-30"
                              style={{
                                backgroundImage: `
                                  repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 3px,
                                    white 3px,
                                    white 6px
                                  ),
                                  repeating-linear-gradient(
                                    -45deg,
                                    transparent,
                                    transparent 3px,
                                    white 3px,
                                    white 6px
                                  )
                                `
                              }}
                            >
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
              
              {/* Multi-Villain Section */}
              <div className="space-y-1.5">
                <FormLabel className="text-base">Villain Hands</FormLabel>
                
                {fields.map((field, index) => {
                  // Get all other villains' cards for exclusion
                  const otherVillainsCards = villains
                    ?.filter((_, i) => i !== index)
                    .flatMap(v => v.cards?.filter((c: any) => c.rank && c.suit).map((c: any) => c.rank + c.suit) || []) || [];
                  
                  return (
                    <div key={field.id} className="relative border border-border rounded-md p-3 bg-card">
                      {/* Remove button (only show if more than 1 villain) */}
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove villain ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div className="text-xs text-muted-foreground mb-1.5">Villain {index + 1}</div>
                      
                      {/* Two-column layout: Cards | Position & BB */}
                      <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                        {/* Column 1: Villain Cards */}
                        <FormField
                          control={control}
                          name={`villains.${index}.cards`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CardSlotPicker
                                  slots={gameType === 'NLH' ? 2 : 4}
                                  selectedCards={field.value || (gameType === 'NLH' ? [{ id: 0 }, { id: 1 }] : [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }])}
                                  onChange={field.onChange}
                                  excludedCards={[
                                    ...(selectedCards.match(/.{2}/g) || []),
                                    ...((flopCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                                    ...((turnCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                                    ...((riverCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                                    ...otherVillainsCards
                                  ].filter(card => 
                                    !field.value?.some(c => c.rank && c.suit && (c.rank + c.suit === card))
                                  )}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {/* Column 2: Position Selector & BB Input stacked */}
                        <div className="flex flex-col gap-1.5">
                          <FormField
                            control={control}
                            name={`villains.${index}.position`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Position" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {positions.map(pos => (
                                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={control}
                            name={`villains.${index}.bigBlind`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    placeholder="BB"
                                    className="h-8 text-xs"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Add Villain Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    cards: gameType === 'NLH' ? [{ id: 0 }, { id: 1 }] : [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
                    position: '',
                    bigBlind: undefined
                  })}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Villain
                </Button>
              </div>
              
              {/* Hand Result */}
              <FormField
                control={control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hand Result</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., +$150, -2 buy-ins, Won with top pair" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Flop Section */}
        <Collapsible open={isFlopOpen} onOpenChange={setIsFlopOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
              <span>Flop</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFlopOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <FormField
              control={control}
              name="flopCards"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flop Cards</FormLabel>
                  <FormControl>
                    <CardSlotPicker
                      slots={3}
                      selectedCards={field.value || []}
                      onChange={field.onChange}
                      excludedCards={[
                        ...(selectedCards.match(/.{2}/g) || []),
                        ...((turnCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                        ...((riverCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                        ...(villains?.flatMap(v => v.cards?.filter((c: any) => c.rank && c.suit).map((c: any) => c.rank + c.suit)) || [])
                      ].filter(card => 
                        !field.value?.some(c => c.rank && c.suit && (c.rank + c.suit === card))
                      )}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="flopAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flop Action</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the action on the flop..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Turn Analysis - Collapsible */}
        <Collapsible open={isTurnOpen} onOpenChange={setIsTurnOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
              <span>Turn</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isTurnOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="turnCards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turn Card</FormLabel>
                    <FormControl>
                      <CardSlotPicker
                        slots={1}
                        selectedCards={field.value || [{ id: 0 }]}
                        onChange={field.onChange}
                        excludedCards={[
                          ...(selectedCards.match(/.{2}/g) || []),
                          ...((flopCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                          ...((riverCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                          ...(villains?.flatMap(v => v.cards?.filter((c: any) => c.rank && c.suit).map((c: any) => c.rank + c.suit)) || [])
                        ].filter(card => 
                          !field.value?.some(c => c.rank && c.suit && (c.rank + c.suit === card))
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="turnAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turn Action</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* River Analysis - Collapsible */}
        <Collapsible open={isRiverOpen} onOpenChange={setIsRiverOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
              <span>River</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isRiverOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="riverCards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>River Card</FormLabel>
                    <FormControl>
                      <CardSlotPicker
                        slots={1}
                        selectedCards={field.value || [{ id: 0 }]}
                        onChange={field.onChange}
                        excludedCards={[
                          ...(selectedCards.match(/.{2}/g) || []),
                          ...((flopCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                          ...((turnCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                          ...(villains?.flatMap(v => v.cards?.filter((c: any) => c.rank && c.suit).map((c: any) => c.rank + c.suit)) || [])
                        ].filter(card => 
                          !field.value?.some(c => c.rank && c.suit && (c.rank + c.suit === card))
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="riverAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>River Action</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

      </div>
        </HandDetailGate>
  );
};

export default StreetByStreetSection;