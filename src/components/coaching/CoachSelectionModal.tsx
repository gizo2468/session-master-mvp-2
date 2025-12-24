import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { CoachProfile } from '@/types/poker';
import Icon from '@/components/ui/Lucide';

interface CoachSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  coaches: CoachProfile[];
  onSelectCoaches: (coachIds: string[]) => void;
  selectedCoaches?: string[];
  loading?: boolean;
}

const CoachSelectionModal: React.FC<CoachSelectionModalProps> = ({
  isOpen,
  onClose,
  coaches,
  onSelectCoaches,
  selectedCoaches = [],
  loading = false
}) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedCoaches);

  // Reset local selection when modal opens or selectedCoaches changes
  React.useEffect(() => {
    setLocalSelected(selectedCoaches);
  }, [selectedCoaches, isOpen]);

  const handleToggleCoach = (coachId: string) => {
    setLocalSelected(prev => 
      prev.includes(coachId) 
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
  };

  const handleSelectCoaches = () => {
    onSelectCoaches(localSelected);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Share" size={20} />
            Share Session with Coaches
          </DialogTitle>
          <DialogDescription>
            Use the toggles to control sharing with each coach. You can share with multiple coaches simultaneously.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {coaches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No connected coaches found.</p>
              <p className="text-xs mt-1">Connect with a coach first to share sessions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={undefined} />
                      <AvatarFallback>
                        {coach.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{coach.displayName}</p>
                      {coach.bio && (
                        <p className="text-xs text-muted-foreground">{coach.bio}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {localSelected.includes(coach.id) ? 'Sharing' : 'Not sharing'}
                    </span>
                    <Switch
                      checked={localSelected.includes(coach.id)}
                      onCheckedChange={() => handleToggleCoach(coach.id)}
                      disabled={loading}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelectCoaches}
            disabled={loading}
            className="flex items-center gap-1"
          >
            {loading ? (
              <Icon name="Loader2" size={14} className="animate-spin" />
            ) : (
              <Icon name={localSelected.length > 0 ? "Share" : "UserX"} size={14} />
            )}
            {localSelected.length > 0 
              ? `Share with ${localSelected.length} coach${localSelected.length !== 1 ? 'es' : ''}` 
              : 'Unshare with all coaches'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoachSelectionModal;