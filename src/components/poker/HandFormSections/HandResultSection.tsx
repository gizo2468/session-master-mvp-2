import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Control } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';
import { cn } from '@/lib/utils';

interface HandResultSectionProps {
  control: Control<FormValues>;
}

const formatValue = (val: number) => {
  if (val > 0) return `+${val}`;
  return val.toString();
};

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
          const currentValue = field.value ?? 0;
          
          return (
            <FormItem>
              <FormControl>
                <div className="space-y-4">
                  {/* Live Value Display */}
                  <div className="text-center">
                    <span className={cn(
                      "text-3xl font-bold transition-colors",
                      currentValue > 0 
                        ? "text-green-500" 
                        : currentValue < 0 
                          ? "text-red-500" 
                          : "text-muted-foreground"
                    )}>
                      {formatValue(currentValue)}
                    </span>
                    <FormField
                      control={control}
                      name="resultUnit"
                      render={({ field: unitField }) => (
                        <span className="text-sm text-muted-foreground ml-1">
                          {unitField.value || 'BB'}
                        </span>
                      )}
                    />
                  </div>

                  {/* Horizontal Slider */}
                  <div className="px-2">
                    <div className="relative">
                      {/* Custom gradient track background */}
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-red-500 via-gray-300 to-green-500 pointer-events-none" />
                      
                      {/* Center tick mark */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-border pointer-events-none z-10" />
                      
                      {/* Slider component */}
                      <Slider
                        value={[currentValue]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        min={-100}
                        max={100}
                        step={0.5}
                        className="relative z-20 [&_[data-slot=track]]:bg-transparent [&_[data-slot=range]]:bg-transparent [&_[data-slot=thumb]]:h-6 [&_[data-slot=thumb]]:w-6 [&_[data-slot=thumb]]:border-2 [&_[data-slot=thumb]]:border-primary [&_[data-slot=thumb]]:bg-background [&_[data-slot=thumb]]:shadow-md"
                      />
                    </div>
                    
                    {/* Scale labels */}
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span className="text-red-400">-100</span>
                      <span>0</span>
                      <span className="text-green-400">+100</span>
                    </div>
                  </div>

                  {/* Manual Input */}
                  <div className="flex items-center justify-center gap-2">
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
                        currentValue > 0 
                          ? "text-green-500" 
                          : currentValue < 0 
                            ? "text-red-500" 
                            : "text-muted-foreground"
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
