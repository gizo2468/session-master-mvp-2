
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSessionContext } from '@/context/SessionContext';

export default function StorageWarningAlert() {
  const { showStorageWarning, dismissStorageWarning } = useSessionContext();
  const [showDialog, setShowDialog] = useState(false);

  if (!showStorageWarning) {
    return null;
  }

  const handleBadgeClick = () => {
    setShowDialog(true);
  };

  const handleDismiss = () => {
    setShowDialog(false);
    dismissStorageWarning();
  };

  return (
    <>
      <Badge 
        variant="warning" 
        className="cursor-pointer hover:bg-amber-200 transition-colors flex items-center gap-1"
        onClick={handleBadgeClick}
      >
        <AlertTriangle size={12} />
        Storage
      </Badge>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Storage Limit Reached
            </DialogTitle>
            <DialogDescription className="text-left">
              Some older sessions have been removed from local storage to save space. 
              Your recent sessions and active session are still available.
              <br /><br />
              You can still access older sessions through your account history if you're logged in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Keep Showing
            </Button>
            <Button 
              onClick={handleDismiss}
              className="bg-poker-gold hover:bg-poker-darkGold text-white"
            >
              Don't Show Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
