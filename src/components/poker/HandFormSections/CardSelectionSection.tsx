import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
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
          <div className="flex items-center gap-2">
            <FormLabel>Cards</FormLabel>
            <AdaptiveTooltip content={tooltipContent.cards}>
              <CircleHelp className="h-4 w-4 text-gray-500" />
            </AdaptiveTooltip>
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