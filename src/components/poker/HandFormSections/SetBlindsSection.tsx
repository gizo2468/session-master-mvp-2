import React, { useState } from 'react';
import { Control, UseFormSetValue, Controller } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Settings2 } from 'lucide-react';

interface SetBlindsSectionProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  smallBlind?: number;
  bigBlind?: number;
}


const SetBlindsSection: React.FC<SetBlindsSectionProps> = ({
  control,
  setValue,
  smallBlind,
  bigBlind,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSmallBlind, setTempSmallBlind] = useState<string>(smallBlind?.toString() || '');
  const [tempBigBlind, setTempBigBlind] = useState<string>(bigBlind?.toString() || '');

  const handleOpenModal = () => {
    setTempSmallBlind(smallBlind?.toString() || '');
    setTempBigBlind(bigBlind?.toString() || '');
    setIsOpen(true);
  };

  const handleSave = () => {
    const sb = tempSmallBlind ? parseFloat(tempSmallBlind) : undefined;
    const bb = tempBigBlind ? parseFloat(tempBigBlind) : undefined;
    
    setValue('smallBlind', sb);
    setValue('bigBlind', bb);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const hasBlindsSet = smallBlind !== undefined || bigBlind !== undefined;

  return (
    <div className="flex flex-col items-start space-y-1">
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-sm text-muted-foreground">Hero Stack:</span>
        <Controller
          name="heroStackBB"
          control={control}
          render={({ field: stackField }) => (
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
          )}
        />
        <span className="text-sm text-muted-foreground font-medium">BB</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenModal}
          className="flex items-center gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Set Blinds
        </Button>
      </div>

      {hasBlindsSet && (
        <p className="text-xs text-muted-foreground">
          Blinds set: SB {smallBlind ?? '-'} / BB {bigBlind ?? '-'}
        </p>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Set Blinds</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Small Blind */}
            <div className="space-y-2">
              <Label htmlFor="smallBlind">Small Blind</Label>
              <Input
                id="smallBlind"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 500"
                value={tempSmallBlind}
                onChange={(e) => setTempSmallBlind(e.target.value)}
                autoComplete="off"
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Big Blind */}
            <div className="space-y-2">
              <Label htmlFor="bigBlind">Big Blind</Label>
              <Input
                id="bigBlind"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 1000"
                value={tempBigBlind}
                onChange={(e) => setTempBigBlind(e.target.value)}
                autoComplete="off"
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSave}
              className="bg-poker-gold hover:bg-poker-darkGold text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SetBlindsSection;
