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

interface ConnectionLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'coach' | 'student';
  maxConnections: number;
}

const ConnectionLimitDialog: React.FC<ConnectionLimitDialogProps> = ({
  open,
  onOpenChange,
  userRole,
  maxConnections,
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/subscription');
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  const limitText = userRole === 'coach' 
    ? `Free coaches can connect with up to ${maxConnections} students/coaches`
    : `Free players can connect with up to ${maxConnections} coach`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Lock" className="h-5 w-5" />
            Connection Limit Reached
          </DialogTitle>
          <DialogDescription className="text-left space-y-2">
            <p>{limitText}.</p>
            <p>To connect with additional {userRole === 'coach' ? 'players or coaches' : 'coaches'}, upgrade to Premium for unlimited connections.</p>
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

export default ConnectionLimitDialog;
