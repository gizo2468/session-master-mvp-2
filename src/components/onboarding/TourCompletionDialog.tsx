import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

interface TourCompletionDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function TourCompletionDialog({ open, onClose }: TourCompletionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-primary text-center">Tutorial Complete</DialogTitle>
          <DialogDescription asChild className="text-center text-foreground/80">
            <div className="space-y-3">
              <p>Congratulations! You've successfully completed the Session Master walkthrough.</p>
              <p>Your first session has been saved, and you can view it anytime on the Home screen under Recent Sessions.</p>
              <p>If you ever want a refresher, you can restart the tutorial at any time from the Settings page.</p>
              <p>Keep tracking your sessions and improving your game. Good luck at the tables!</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Start Playing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
