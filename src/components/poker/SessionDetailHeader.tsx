import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import { useAuth } from '@/context/AuthContext';
import { useSessionSharing } from '@/hooks/useSessionSharing';
import CoachSelectionModal from '@/components/coaching/CoachSelectionModal';
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
  const [showCoachModal, setShowCoachModal] = useState(false);
  
  // Only show the toggle for players (students), not coaches
  const showShareToggle = user?.role === 'student';
  
  // Use the session sharing hook
  const {
    isShared,
    connectedCoaches,
    loading: sharingLoading,
    shareSession,
    unshareSession
  } = useSessionSharing(sessionId);

  const handleToggleShare = async () => {
    if (isShared) {
      // If already shared, unshare immediately
      await unshareSession();
    } else {
      // If not shared, show coach selection modal
      if (connectedCoaches.length === 0) {
        // No coaches connected - could show a message or redirect to coach connection
        return;
      } else if (connectedCoaches.length === 1) {
        // Only one coach - share directly
        await shareSession(connectedCoaches[0].id);
      } else {
        // Multiple coaches - show selection modal
        setShowCoachModal(true);
      }
    }
  };

  const handleSelectCoach = async (coachId: string) => {
    await shareSession(coachId);
  };

  return (
    <>
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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-serif font-bold">
              Session Summary
            </h1>
            {showShareToggle && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="share-coach" 
                  checked={isShared}
                  onCheckedChange={handleToggleShare}
                  disabled={sharingLoading}
                />
                <Label htmlFor="share-coach" className="text-sm">
                  Share with Coach
                  {sharingLoading && (
                    <Icon name="Loader2" size={12} className="ml-1 animate-spin inline" />
                  )}
                </Label>
              </div>
            )}
          </div>
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
        </div>
      </header>

      <CoachSelectionModal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        coaches={connectedCoaches}
        onSelectCoach={handleSelectCoach}
        loading={sharingLoading}
      />
    </>
  );
};

export default SessionDetailHeader;