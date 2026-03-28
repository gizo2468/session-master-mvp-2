import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { CircleHelp } from 'lucide-react';
import { Control } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';
import { tooltipContent } from '@/utils/handFormHelpers';

interface GameTypeSectionProps {
  control: Control<FormValues>;
  gameType: string;
}

const GameTypeSection: React.FC<GameTypeSectionProps> = ({
  control,
  gameType
}) => {
  return (
    <FormField
      control={control}
      name="gameType"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2">
            <FormLabel>Game Type</FormLabel>
            <AdaptiveTooltip content={tooltipContent.cards}>
              <CircleHelp className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </AdaptiveTooltip>
          </div>
          <FormControl>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('NLH button clicked');
                  field.onChange('NLH');
                }}
                className={`flex-1 py-2 px-4 rounded-full transition-all cursor-pointer ${
                  field.value === 'NLH' 
                    ? 'bg-poker-gold text-white' 
                    : 'bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-muted'
                }`}
              >
                Texas Hold'em
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('PLO button clicked, current value:', field.value);
                  field.onChange('PLO');
                  console.log('PLO onChange called');
                }}
                className={`flex-1 py-2 px-4 rounded-full transition-all cursor-pointer ${
                  field.value === 'PLO' 
                    ? 'bg-poker-gold text-white' 
                    : 'bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-muted'
                }`}
              >
                Omaha
              </button>
            </div>
          </FormControl>
          <FormDescription>
            {gameType === 'NLH' 
              ? 'Texas Hold\'em - select exactly 2 cards' 
              : 'Omaha - select between 4-6 cards depending on variant'}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default GameTypeSection;