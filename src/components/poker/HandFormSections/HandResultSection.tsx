import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Control } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';
import { cn } from '@/lib/utils';

interface HandResultSectionProps {
  control: Control<FormValues>;
}

const ROLLER_VALUES = [-100, -50, -25, -10, -5, -2, -1, 0, 1, 2, 5, 10, 25, 50, 100];

const HandResultSection: React.FC<HandResultSectionProps> = ({ control }) => {
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
          const value = field.value ?? 0;
          const colorClass = value > 0 
            ? 'text-green-500' 
            : value < 0 
              ? 'text-red-500' 
              : 'text-muted-foreground';
          
          return (
            <FormItem>
              <FormControl>
                <div className="space-y-3">
                  {/* Manual Input */}
                  <div className="flex items-center gap-2">
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
                        "text-center text-lg font-bold h-12 flex-1",
                        colorClass
                      )}
                      autoComplete="off"
                      data-form-type="other"
                      data-credential="false"
                      data-1p-ignore="true"
                      data-lpignore="true"
                    />
                  </div>
                  
                  {/* Roller Quick Select */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {ROLLER_VALUES.map((rollerVal) => {
                      const isSelected = field.value === rollerVal;
                      const btnColorClass = rollerVal > 0 
                        ? 'hover:bg-green-500/20 hover:text-green-500 hover:border-green-500/50' 
                        : rollerVal < 0 
                          ? 'hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50' 
                          : 'hover:bg-muted';
                      const selectedClass = rollerVal > 0 
                        ? 'bg-green-500/20 text-green-500 border-green-500/50' 
                        : rollerVal < 0 
                          ? 'bg-red-500/20 text-red-500 border-red-500/50' 
                          : 'bg-muted text-muted-foreground border-border';
                      
                      return (
                        <button
                          key={rollerVal}
                          type="button"
                          onClick={() => field.onChange(rollerVal)}
                          className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-md border transition-all",
                            isSelected ? selectedClass : cn("border-border text-muted-foreground", btnColorClass)
                          )}
                        >
                          {rollerVal > 0 ? `+${rollerVal}` : rollerVal}
                        </button>
                      );
                    })}
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
