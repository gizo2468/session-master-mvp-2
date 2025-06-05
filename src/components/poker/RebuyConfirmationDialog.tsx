
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface RebuyConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RebuyConfirmationDialog({
  open,
  onOpenChange,
  amount,
  onConfirm,
  onCancel
}: RebuyConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Rebuy</DialogTitle>
          <DialogDescription>
            Are you sure you want to add a ${amount.toFixed(2)} rebuy to this table?
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
            onClick={onConfirm}
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
