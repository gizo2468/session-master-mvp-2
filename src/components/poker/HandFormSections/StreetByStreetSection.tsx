import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { CircleHelp, ChevronDown, Trash2, Plus, X } from 'lucide-react';
import { Control, UseFormSetValue, useFieldArray, useWatch, useFormContext } from 'react-hook-form';
import { useIsMobile } from '@/hooks/use-mobile';
import HandDetailGate from '@/components/ui/HandDetailGate';
import CardSlotPicker from '../CardSlotPicker';
import StreetActionEntry from './StreetActionEntry';
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
  onGlobalUnitChange?: (unit: 'BB' | 'Chips') => void;
  heroPosition?: string;
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
  villains,
  onGlobalUnitChange,
  heroPosition
}) => {
  const isMobile = useIsMobile();
  
  // Local state for parent Actions collapsible
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);
  
  // Use field array for dynamic villain management
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'villains'
  });
  
  // Get form context for accessing/updating action fields
  const { getValues, setValue: setFormValue } = useFormContext<FormValues>();
  
  // Watch global unit from Hand Result section
  const resultUnit = useWatch({ control, name: 'resultUnit' }) as 'BB' | 'Chips';
  
  // Handle global unit change - delegate to parent handler
  const handleUnitChange = (newUnit: 'BB' | 'Chips') => {
    if (onGlobalUnitChange) {
      onGlobalUnitChange(newUnit);
    }
  };
  
  // Handle villain removal with action cleanup
  const handleRemoveVillain = (index: number) => {
    const removedVillainName = `Villain ${index + 1}`;
    
    // Helper to clean up actions for a removed villain
    const cleanupActions = (actions: any[] | undefined): any[] => {
      if (!actions || !Array.isArray(actions)) return [];
      return actions
        // Filter out actions from deleted villain
        .filter(a => a.actor !== removedVillainName)
        // Re-number remaining villains (if Villain 2 deleted, Villain 3 → Villain 2)
        .map(a => {
          if (a.actor && a.actor.startsWith('Villain ')) {
            const villainNum = parseInt(a.actor.split(' ')[1]);
            if (villainNum > index + 1) {
              return { ...a, actor: `Villain ${villainNum - 1}` };
            }
          }
          return a;
        });
    };
    
    // Get current actions and clean them
    const currentFlopActions = getValues('flopActions');
    const currentTurnActions = getValues('turnActions');
    const currentRiverActions = getValues('riverActions');
    
    setFormValue('flopActions', cleanupActions(currentFlopActions));
    setFormValue('turnActions', cleanupActions(currentTurnActions));
    setFormValue('riverActions', cleanupActions(currentRiverActions));
    
    // Remove the villain
    remove(index);
  };

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
          <div className="flex flex-col items-center w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
              <span className="text-lg">Board & Villains</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 mt-1 ${isShowdownOpen ? 'rotate-180' : ''}`} />
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
                <div className="flex flex-wrap gap-1 mt-2">
                  {/* Flop Cards - 3 slots */}
                  <FormField
                    control={control}
                    name="flopCards"
                    render={({ field }) => (
                      <CardSlotPicker
                        slots={3}
                        selectedCards={field.value || [{ id: 0 }, { id: 1 }, { id: 2 }]}
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
                    )}
                  />
                  
                  {/* Turn Card - 1 slot */}
                  <FormField
                    control={control}
                    name="turnCards"
                    render={({ field }) => (
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
                    )}
                  />
                  
                  {/* River Card - 1 slot */}
                  <FormField
                    control={control}
                    name="riverCards"
                    render={({ field }) => (
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
                    )}
                  />
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
                  
                  // Get all taken positions (Hero + other villains)
                  const takenPositions = [
                    heroPosition,
                    ...villains
                      ?.filter((_, i) => i !== index)
                      .map(v => v.position)
                      .filter(Boolean) || []
                  ].filter(Boolean);
                  
                  return (
                    <div key={field.id} className="relative border border-border rounded-md p-3 bg-card">
                      {/* Remove button (only show if more than 1 villain) */}
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVillain(index)}
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
                                      <SelectItem 
                                        key={pos} 
                                        value={pos}
                                        disabled={takenPositions.includes(pos)}
                                        className={takenPositions.includes(pos) ? 'opacity-50' : ''}
                                      >
                                        {pos}
                                      </SelectItem>
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
              
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Actions Section - Groups Flop/Turn/River */}
        <Collapsible open={isActionsOpen} onOpenChange={setIsActionsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex flex-col items-center w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
            <span className="text-lg">Actions</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 mt-1 ${isActionsOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0 pt-2">
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
                  name="flopActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flop Action</FormLabel>
                      <FormControl>
                        <StreetActionEntry
                          actions={field.value || []}
                          onChange={field.onChange}
                          globalUnit={resultUnit}
                          onUnitChange={handleUnitChange}
                          villainCount={fields.length}
                          onCancel={() => setIsFlopOpen(false)}
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
                  name="turnActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turn Action</FormLabel>
                      <FormControl>
                        <StreetActionEntry
                          actions={field.value || []}
                          onChange={field.onChange}
                          globalUnit={resultUnit}
                          onUnitChange={handleUnitChange}
                          villainCount={fields.length}
                          onCancel={() => setIsTurnOpen(false)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
                  name="riverActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>River Action</FormLabel>
                      <FormControl>
                        <StreetActionEntry
                          actions={field.value || []}
                          onChange={field.onChange}
                          globalUnit={resultUnit}
                          onUnitChange={handleUnitChange}
                          villainCount={fields.length}
                          onCancel={() => setIsRiverOpen(false)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
          </CollapsibleContent>
        </Collapsible>

      </div>
        </HandDetailGate>
  );
};

export default StreetByStreetSection;