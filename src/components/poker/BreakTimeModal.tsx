import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Clock } from 'lucide-react';

interface BreakTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (minutes: number, notes: string) => Promise<{ error?: string } | void>;
}

const BreakTimeModal: React.FC<BreakTimeModalProps> = ({ open, onOpenChange, onStart }) => {
  const [minutes, setMinutes] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const parsed = parseInt(minutes, 10);
  const valid = Number.isFinite(parsed) && parsed >= 1 && parsed <= 240;

  const handleStart = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const res = await onStart(parsed, notes);
      if (res && 'error' in res && res.error) {
        toast({ title: 'Could not start break', description: String(res.error), variant: 'destructive' });
        return;
      }
      setMinutes('');
      setNotes('');
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take a Break</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="break-minutes">Duration (minutes)</Label>
            <Input
              id="break-minutes"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              max={240}
              placeholder="e.g. 15"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ''))}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="break-notes">Notes (optional)</Label>
            <Textarea
              id="break-notes"
              placeholder="What are you doing on this break?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!valid || submitting}
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
          >
            {submitting ? 'Starting…' : 'Start Break'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BreakTimeModal;
