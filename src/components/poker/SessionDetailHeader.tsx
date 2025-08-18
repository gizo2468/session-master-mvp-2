import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
    sharedCoaches,
    connectedCoaches,
    loading: sharingLoading,
    shareSession,
    unshareSession
  } = useSessionSharing(sessionId);

  const handleOpenShareModal = () => {
    setShowCoachModal(true);
  };

  const handleSelectCoaches = async (coachIds: string[]) => {
    await shareSession(coachIds);
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
              <Button
                onClick={handleOpenShareModal}
                disabled={sharingLoading || connectedCoaches.length === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {sharingLoading ? (
                  <Icon name="Loader2" size={14} className="animate-spin" />
                ) : (
                  <Icon name="Share" size={14} />
                )}
                {isShared ? `Shared with ${sharedCoaches.length} coach${sharedCoaches.length !== 1 ? 'es' : ''}` : 'Share with Coach'}
              </Button>
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
        onSelectCoaches={handleSelectCoaches}
        selectedCoaches={sharedCoaches}
        loading={sharingLoading}
      />
    </>
  );
};

export default SessionDetailHeader;