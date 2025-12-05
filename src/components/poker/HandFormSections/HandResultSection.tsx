import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Control, useWatch, UseFormSetValue } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';
import { cn } from '@/lib/utils';

interface HandResultSectionProps {
  control: Control<FormValues>;
  setValue?: UseFormSetValue<FormValues>;
  onUnitChange?: (newUnit: 'BB' | 'Chips') => void;
}

const formatDisplayValue = (val: number) => {
  const sign = val > 0 ? '+' : '';
  if (Math.abs(val) >= 1000) {
    return `${sign}${val.toLocaleString()}`;
  }
  return `${sign}${val}`;
};

const HandResultSection: React.FC<HandResultSectionProps> = ({ control, setValue, onUnitChange }) => {
  const resultUnit = useWatch({ control, name: 'resultUnit' });
  const resultValue = useWatch({ control, name: 'resultValue' });
  
  const currentValue = resultValue ?? 0;
  const unitLabel = resultUnit === 'BB' ? 'BB' : 'Chips';
  
  // Local state for sign toggle (shared for both modes)
  const [sign, setSign] = useState<'+' | '-'>(currentValue >= 0 ? '+' : '-');
  
  // Sync sign state when value changes externally or mode changes
  useEffect(() => {
    setSign(currentValue >= 0 ? '+' : '-');
  }, [resultUnit]);
  
  // Handle unit toggle with conversion
  const handleUnitToggle = (newUnit: 'BB' | 'Chips', fieldOnChange: (value: string) => void) => {
    if (onUnitChange) {
      onUnitChange(newUnit);
    } else {
      fieldOnChange(newUnit);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-base font-bold text-poker-gold">Hand Result</FormLabel>
        
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
                onClick={() => handleUnitToggle('BB', field.onChange)}
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
                onClick={() => handleUnitToggle('Chips', field.onChange)}
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
          const handleSignChange = (newSign: '+' | '-') => {
            setSign(newSign);
            const absValue = Math.abs(currentValue);
            field.onChange(newSign === '-' ? -absValue : absValue);
          };
          
          const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const absVal = parseFloat(e.target.value) || 0;
            const finalVal = sign === '-' ? -absVal : absVal;
            field.onChange(finalVal);
          };
          
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
                      {formatDisplayValue(currentValue)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      {unitLabel}
                    </span>
                  </div>

                  {/* Sign Toggle + Amount Input (same for BB and Chips) */}
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div className="flex items-center gap-4">
                      {/* Sign Toggle */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">Sign</span>
                        <div className="flex gap-1 rounded-md border border-border p-0.5 bg-muted/30">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-9 w-10 text-lg font-bold transition-all",
                              sign === '+' 
                                ? "bg-green-100 text-green-600 shadow-sm dark:bg-green-900/30 dark:text-green-400" 
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => handleSignChange('+')}
                          >
                            +
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-9 w-10 text-lg font-bold transition-all",
                              sign === '-' 
                                ? "bg-red-100 text-red-600 shadow-sm dark:bg-red-900/30 dark:text-red-400" 
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => handleSignChange('-')}
                          >
                            −
                          </Button>
                        </div>
                      </div>
                      
                      {/* Amount Input */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">Amount</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step={resultUnit === 'BB' ? '0.5' : '1'}
                            placeholder="0"
                            value={Math.abs(currentValue) || ''}
                            onChange={handleAmountChange}
                            className={cn(
                              "text-center text-lg font-bold h-10 w-28",
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
                          <span className="text-sm text-muted-foreground">{unitLabel}</span>
                        </div>
                      </div>
                    </div>
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
