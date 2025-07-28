import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import { useSessionSharing } from '@/hooks/useSessionSharing';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';

interface SessionDetailHeaderProps {
  sessionId: string;
  location: string;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const SessionDetailHeader: React.FC<SessionDetailHeaderProps> = ({
  sessionId,
  location,
  onEditClick,
  onDeleteClick
}) => {
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();
  const { user } = useAuth();
  const { isShared, connectedPeople, isLoading, toggleSharing, userRole } = useSessionSharing(
    sessionId, 
    user?.id || ''
  );

  const handleToggleChange = (checked: boolean) => {
    toggleSharing(checked);
  };

  // Only show the toggle if user has connected people
  const showSharingToggle = connectedPeople.length > 0;

  return (
    <header className="mb-8">
      <Button 
        onClick={navigateToHomeWithRefresh}
        variant="ghost" 
        className="text-poker-feltGreen mb-4 flex items-center p-0 hover:bg-transparent"
        disabled={isRefreshing}
      >
        <Icon name={isRefreshing ? "Loader2" : "ArrowLeft"} size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        Back
      </Button>
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-serif font-bold">
          Session Summary
        </h1>
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            <Button 
              onClick={onEditClick}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              <Icon name="Pencil" size={16} />
            </Button>
            <Button 
              onClick={onDeleteClick}
              variant="outline"
              size="icon"
              className="h-8 w-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Icon name="Trash2" size={16} />
            </Button>
          </div>
          {showSharingToggle && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="share-coach" 
                checked={isShared}
                onCheckedChange={handleToggleChange}
                disabled={isLoading}
              />
              <Label htmlFor="share-coach" className="text-sm">
                Share with {userRole === 'student' ? 'Coach' : 'Student'}{connectedPeople.length > 1 ? 's' : ''}
              </Label>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default SessionDetailHeader;