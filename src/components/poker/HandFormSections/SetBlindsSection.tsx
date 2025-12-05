import React, { useState } from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
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
  setValue,
  smallBlind,
  bigBlind,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSmallBlind, setTempSmallBlind] = useState<string>(smallBlind?.toString() || '');
  const [tempBigBlind, setTempBigBlind] = useState<string>(bigBlind?.toString() || '');
  const [blindUnit, setBlindUnit] = useState<'BB' | 'Chips'>('Chips');

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
    <div className="space-y-2">
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
      
      {hasBlindsSet && (
        <p className="text-xs text-muted-foreground">
          Blinds set: SB {smallBlind ?? '-'} / BB {bigBlind ?? '-'} {blindUnit}
        </p>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Set Blinds</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Small Blind */}
            <div className="space-y-2">
              <Label htmlFor="smallBlind">Small Blind</Label>
              <div className="flex gap-2">
                <Input
                  id="smallBlind"
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 1"
                  value={tempSmallBlind}
                  onChange={(e) => setTempSmallBlind(e.target.value)}
                  className="flex-1"
                  autoComplete="off"
                  data-form-type="other"
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
                <div className="flex rounded-md border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setBlindUnit('BB')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      blindUnit === 'BB'
                        ? 'bg-poker-gold text-white'
                        : 'bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    BB
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlindUnit('Chips')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      blindUnit === 'Chips'
                        ? 'bg-poker-gold text-white'
                        : 'bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    Chips
                  </button>
                </div>
              </div>
            </div>

            {/* Big Blind */}
            <div className="space-y-2">
              <Label htmlFor="bigBlind">Big Blind</Label>
              <div className="flex gap-2">
                <Input
                  id="bigBlind"
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 2"
                  value={tempBigBlind}
                  onChange={(e) => setTempBigBlind(e.target.value)}
                  className="flex-1"
                  autoComplete="off"
                  data-form-type="other"
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
                <div className="flex rounded-md border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setBlindUnit('BB')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      blindUnit === 'BB'
                        ? 'bg-poker-gold text-white'
                        : 'bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    BB
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlindUnit('Chips')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      blindUnit === 'Chips'
                        ? 'bg-poker-gold text-white'
                        : 'bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    Chips
                  </button>
                </div>
              </div>
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
