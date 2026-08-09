import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { CircleHelp } from 'lucide-react';
import { Control } from 'react-hook-form';
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
          
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CardSelectionSection;