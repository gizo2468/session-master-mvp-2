import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { CircleHelp } from 'lucide-react';
import { Control } from 'react-hook-form';
import { FormValues, positions, tooltipContent } from '@/utils/handFormHelpers';

interface PositionSectionProps {
  control: Control<FormValues>;
  selectedPositionIndex: number;
  onPositionSelect: (index: number) => void;
}

const PositionSection: React.FC<PositionSectionProps> = ({
  control,
  selectedPositionIndex,
  onPositionSelect
}) => {
  return (
    <FormField
      control={control}
      name="position"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2">
            <FormLabel>Position</FormLabel>
            <AdaptiveTooltip content={tooltipContent.position}>
              <CircleHelp className="h-4 w-4 text-gray-500" />
            </AdaptiveTooltip>
          </div>
          
          {/* iOS-style wheel picker */}
          <FormControl>
            <div className="relative flex justify-center w-full h-[130px] overflow-hidden">
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 h-[30px] border-y border-transparent"></div>
              </div>
              
              <div className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scrollbar-none">
                {/* Empty spaces at top and bottom to allow centering */}
                <div className="h-[50px]" aria-hidden="true"></div>
                
                {positions.map((position, index) => (
                  <div
                    key={position}
                    className={`h-[30px] flex items-center justify-center cursor-pointer snap-center transition-all duration-200 ${
                      index === selectedPositionIndex 
                        ? 'text-poker-gold font-bold text-lg' 
                        : 'text-gray-600 text-base hover:text-gray-800'
                    }`}
                    onClick={() => onPositionSelect(index)}
                  >
                    {position}
                  </div>
                ))}
                
                {/* Empty spaces at top and bottom to allow centering */}
                <div className="h-[50px]" aria-hidden="true"></div>
              </div>
              
              {/* Selection indicator */}
              <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 h-[30px] border-y-2 border-poker-gold/20 pointer-events-none"></div>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default PositionSection;