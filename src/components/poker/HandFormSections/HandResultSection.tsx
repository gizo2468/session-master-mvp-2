import React, { useRef, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Control } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';
import { cn } from '@/lib/utils';

interface HandResultSectionProps {
  control: Control<FormValues>;
}

const ROLLER_VALUES = [
  -100, -75, -50, -40, -30, -25, -20, -15, -10, -8, -6, -5, -4, -3, -2.5, -2, -1.5, -1, -0.5,
  0,
  0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100
];

const getValueColor = (val: number, isSelected: boolean) => {
  if (val > 0) return isSelected ? 'text-green-500 font-bold text-lg' : 'text-green-400/70 text-sm';
  if (val < 0) return isSelected ? 'text-red-500 font-bold text-lg' : 'text-red-400/70 text-sm';
  return isSelected ? 'text-muted-foreground font-bold text-lg' : 'text-muted-foreground/70 text-sm';
};

const formatValue = (val: number) => {
  if (val > 0) return `+${val}`;
  return val.toString();
};

const HandResultSection: React.FC<HandResultSectionProps> = ({ control }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-base font-semibold">Hand Result (Net)</FormLabel>
        
        {/* BB/Chips Toggle */}
        <FormField
          control={control}
          name="resultUnit"
          render={({ field }) => (
            <div className="flex gap-1 rounded-md border border-border p-0.5 bg-muted/30">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs font-medium transition-all",
                  field.value === 'BB' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => field.onChange('BB')}
              >
                BB
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs font-medium transition-all",
                  field.value === 'Chips' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => field.onChange('Chips')}
              >
                Chips
              </Button>
            </div>
          )}
        />
      </div>
      
      <FormField
        control={control}
        name="resultValue"
        render={({ field }) => {
          const currentValue = field.value ?? 0;
          const selectedIndex = ROLLER_VALUES.findIndex(v => v === currentValue);
          
          // Scroll to selected value on mount
          useEffect(() => {
            if (scrollContainerRef.current && selectedIndex !== -1) {
              const itemHeight = 30;
              const containerHeight = 130;
              const scrollTop = (selectedIndex * itemHeight) - (containerHeight / 2) + (itemHeight / 2);
              scrollContainerRef.current.scrollTop = Math.max(0, scrollTop);
            }
          }, []);

          const inputColorClass = currentValue > 0 
            ? 'text-green-500' 
            : currentValue < 0 
              ? 'text-red-500' 
              : 'text-muted-foreground';
          
          return (
            <FormItem>
              <FormControl>
                <div className="space-y-3">
                  {/* Scrollable Roller */}
                  <div className="relative rounded-lg border border-border bg-muted/20">
                    {/* Selection indicator */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[30px] border-y-2 border-primary/50 bg-primary/10 pointer-events-none z-10" />
                    
                    <div
                      ref={scrollContainerRef}
                      className="h-[130px] overflow-y-auto snap-y snap-mandatory scrollbar-thin"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      <div className="py-[50px]">
                        {ROLLER_VALUES.map((val) => {
                          const isSelected = currentValue === val;
                          return (
                            <div
                              key={val}
                              onClick={() => field.onChange(val)}
                              className={cn(
                                "h-[30px] flex items-center justify-center cursor-pointer snap-center transition-all",
                                getValueColor(val, isSelected)
                              )}
                            >
                              {formatValue(val)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Manual Input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Or type:</span>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? undefined : parseFloat(val));
                      }}
                      className={cn(
                        "text-center text-lg font-bold h-10 w-24",
                        inputColorClass
                      )}
                      autoComplete="off"
                      data-form-type="other"
                      data-credential="false"
                      data-1p-ignore="true"
                      data-lpignore="true"
                    />
                  </div>
                </div>
              </FormControl>
            </FormItem>
          );
        }}
      />
    </div>
  );
};

export default HandResultSection;
