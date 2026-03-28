import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
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
  villains: any[];
}

const CardSelectionSection: React.FC<CardSelectionSectionProps> = ({
  control,
  gameType,
  flopCards,
  turnCards,
  riverCards,
  villains
}) => {
  return (
    <FormField
      control={control}
      name="cards"
      render={({ field }) => (
        <FormItem>
          {/* Cards label + help icon */}
          <div className="flex items-center gap-2">
            <FormLabel>Cards</FormLabel>
            <AdaptiveTooltip content={tooltipContent.cards}>
              <CircleHelp className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </AdaptiveTooltip>
          </div>
          
          <FormControl>
            <CardSelector 
              selectedCards={field.value} 
              onChange={field.onChange}
              maxCards={getMaxCards(gameType)}
              excludedCards={getExcludedCardsForMain(flopCards, turnCards, riverCards, villains)}
            />
          </FormControl>
          
          {/* Hero Stack BB input - always below cards */}
          <FormField
            control={control}
            name="heroStackBB"
            render={({ field: stackField }) => (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm text-muted-foreground">Hero Stack:</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0.5"
                  placeholder="0"
                  aria-label="Hero stack in BB"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  name="hero-stack-bb"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  {...stackField}
                  value={stackField.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      stackField.onChange(undefined);
                    } else {
                      const num = parseFloat(value);
                      if (!isNaN(num) && isFinite(num) && num >= 0) {
                        stackField.onChange(num);
                      }
                    }
                  }}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-sm text-muted-foreground font-medium">BB</span>
              </div>
            )}
          />
          
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CardSelectionSection;