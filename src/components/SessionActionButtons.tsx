
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/Lucide';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { PokerSession } from '@/types/poker';

interface SessionActionButtonsProps {
  session: PokerSession;
}

export default function SessionActionButtons({ session }: SessionActionButtonsProps) {
  const navigate = useNavigate();
  const { deleteSession, refreshSessionsFromDatabase } = useSessionContext();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    // Navigate to edit session page with the session ID
    navigate(`/session/${session.id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      console.log('🗑️ Deleting session from database:', session.id);
      
      await deleteSession(session.id);
      
      // Refresh the sessions list from database to ensure UI is updated
      if (refreshSessionsFromDatabase) {
        await refreshSessionsFromDatabase();
      }
      
      toast({
        title: "Session Deleted",
        description: "The session has been permanently deleted from your records."
      });
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      toast({
        title: "Error Deleting Session",
        description: "There was a problem deleting the session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="flex items-center gap-1"
        >
          <Icon name="edit" size={14} />
          <span>Edit</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Icon name="trash-2" size={14} />
          <span>Delete</span>
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <div className="text-sm">
              <div className="font-medium">{session.location}</div>
              <div className="text-gray-500">
                {session.gameType} • {session.format}
              </div>
              <div className="text-gray-500">
                {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Icon name="trash-2" size={14} />
                  <span>Delete Session</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
