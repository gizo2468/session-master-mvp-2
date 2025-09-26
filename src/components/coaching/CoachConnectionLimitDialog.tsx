import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';

interface CoachConnectionLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CoachConnectionLimitDialog: React.FC<CoachConnectionLimitDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/subscription');
    // Ensure we scroll to the top of the subscription page
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Lock" className="h-5 w-5" />
            Connection Limit Reached
          </DialogTitle>
          <DialogDescription className="text-left space-y-2">
            <p>Free players can only connect to one coach at a time.</p>
            <p>To connect with additional coaches, upgrade to Premium for unlimited connections.</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="poker"
            onClick={handleUpgrade}
            className="flex items-center gap-2"
          >
            <Icon name="Crown" className="h-4 w-4" />
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoachConnectionLimitDialog;