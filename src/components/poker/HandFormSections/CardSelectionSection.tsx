import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { CircleHelp } from 'lucide-react';
import { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import CardSelector from '../CardSelector';
import { FormValues, getMaxCards, getExcludedCardsForMain, tooltipContent } from '@/utils/handFormHelpers';

interface CardSelectionSectionProps {
  control: Control<FormValues>;
  gameType: string;
  flopCards: any[];
  turnCards: any[];
  riverCards: any[];
  villainCards: any[];
}

const CardSelectionSection: React.FC<CardSelectionSectionProps> = ({
  control,
  gameType,
  flopCards,
  turnCards,
  riverCards,
  villainCards
}) => {
  return (
    <FormField
      control={control}
      name="cards"
      render={({ field }) => (
      <FormItem>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left side: Cards label + help icon */}
          <div className="flex items-center gap-2">
            <FormLabel>Cards</FormLabel>
            <AdaptiveTooltip content={tooltipContent.cards}>
              <CircleHelp className="h-4 w-4 text-gray-500" />
            </AdaptiveTooltip>
          </div>
          
          {/* Right side: BB input field */}
          <FormField
            control={control}
            name="bigBlind"
            render={({ field: bbField }) => (
              <div className="flex items-center gap-1.5 self-center translate-y-[24px]">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  placeholder="0"
                  aria-label="Big Blind amount"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  name="bb-amount"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  {...bbField}
                  value={bbField.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      bbField.onChange(undefined);
                    } else {
                      const num = parseFloat(value);
                      if (!isNaN(num) && isFinite(num) && num >= 0) {
                        bbField.onChange(num);
                      }
                    }
                  }}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-sm text-muted-foreground font-medium">BB</span>
              </div>
            )}
          />
        </div>
        <FormControl>
            <CardSelector 
              selectedCards={field.value} 
              onChange={field.onChange}
              maxCards={getMaxCards(gameType)}
              excludedCards={getExcludedCardsForMain(flopCards, turnCards, riverCards, villainCards)}
            />
          </FormControl>
          <FormDescription>
            {gameType === 'NLH' 
              ? 'Select exactly 2 cards - click a card to remove it' 
              : 'Select between 4-6 cards - click a card to remove it'}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CardSelectionSection;