import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Control, useWatch } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';
import { cn } from '@/lib/utils';

interface HandResultSectionProps {
  control: Control<FormValues>;
}

const formatValue = (val: number) => {
  if (val > 0) return `+${val}`;
  return val.toString();
};

const formatChipsValue = (val: number) => {
  const sign = val > 0 ? '+' : '';
  if (Math.abs(val) >= 1000) {
    return `${sign}${val.toLocaleString()}`;
  }
  return `${sign}${val}`;
};

const HandResultSection: React.FC<HandResultSectionProps> = ({ control }) => {
  const resultUnit = useWatch({ control, name: 'resultUnit' });
  const resultValue = useWatch({ control, name: 'resultValue' });
  
  const isEditable = resultUnit === 'BB';
  const currentValue = resultValue ?? 0;
  
  // Local state for chip sign toggle
  const [chipSign, setChipSign] = useState<'+' | '-'>(currentValue >= 0 ? '+' : '-');
  
  // Sync sign state when switching to Chips mode or when value changes externally
  useEffect(() => {
    if (resultUnit === 'Chips') {
      setChipSign(currentValue >= 0 ? '+' : '-');
    }
  }, [resultUnit]);

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
          const handleSignChange = (newSign: '+' | '-') => {
            setChipSign(newSign);
            const absValue = Math.abs(currentValue);
            field.onChange(newSign === '-' ? -absValue : absValue);
          };
          
          const handleChipAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const absVal = parseFloat(e.target.value) || 0;
            const finalVal = chipSign === '-' ? -absVal : absVal;
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
                      {isEditable ? formatValue(currentValue) : formatChipsValue(currentValue)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      {isEditable ? 'BB' : 'Chips'}
                    </span>
                  </div>

                  {isEditable ? (
                    <>
                      {/* Horizontal Slider - BB Mode Only */}
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

                      {/* Manual Input - BB Mode Only */}
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
                    </>
                  ) : (
                    /* Chips Mode - Sign Toggle + Numeric Input */
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
                                chipSign === '+' 
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
                                chipSign === '-' 
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
                              placeholder="0"
                              value={Math.abs(currentValue) || ''}
                              onChange={handleChipAmountChange}
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
                            <span className="text-sm text-muted-foreground">Chips</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
