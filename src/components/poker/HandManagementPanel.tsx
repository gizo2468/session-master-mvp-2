
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { HandData } from '@/types/poker';
import HandsList from './HandsList';
import HandForm from './HandForm';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

interface HandManagementPanelProps {
  sessionId: string;
  tableId: string;
  hands?: HandData[];
  onClose?: () => void;
}

const HandManagementPanel: React.FC<HandManagementPanelProps> = ({ 
  sessionId,
  tableId,
  hands = [],
  onClose,
}) => {
  const [isAddHandOpen, setIsAddHandOpen] = useState(false);
  const [isEditHandOpen, setIsEditHandOpen] = useState(false);
  const [editingHand, setEditingHand] = useState<HandData | null>(null);
  const [handToDelete, setHandToDelete] = useState<string | null>(null);
  
  const { addHand, updateHand, deleteHand } = useSessionContext();
  const { toast } = useToast();
  
  const handleAddHand = (handData: Partial<HandData>) => {
    addHand(sessionId, tableId, handData as Omit<HandData, 'id' | 'createdAt' | 'tableId'>);
    toast({
      title: 'Hand Added',
      description: 'Your hand has been successfully added.',
    });
    setIsAddHandOpen(false);
  };
  
  const handleEditHand = (handData: Partial<HandData>) => {
    if (editingHand && handData.id) {
      updateHand(sessionId, tableId, {
        ...editingHand,
        ...handData,
      });
      toast({
        title: 'Hand Updated',
        description: 'Your hand has been successfully updated.',
      });
    }
    setEditingHand(null);
    setIsEditHandOpen(false);
  };
  
  const onEditHand = (hand: HandData) => {
    setEditingHand(hand);
    setIsEditHandOpen(true);
  };
  
  const onDeleteHand = (handId: string) => {
    setHandToDelete(handId);
  };
  
  const confirmDeleteHand = () => {
    if (handToDelete) {
      deleteHand(sessionId, tableId, handToDelete);
      setHandToDelete(null);
      toast({
        title: 'Hand Deleted',
        description: 'Your hand has been successfully deleted.',
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Hands</h3>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setIsAddHandOpen(true)}
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" /> 
            Add Hand
          </Button>
          
          {onClose && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          )}
        </div>
      </div>
      
      <HandsList 
        hands={hands} 
        onEditHand={onEditHand}
        onDeleteHand={onDeleteHand}
      />
      
      <HandForm
        open={isAddHandOpen}
        onOpenChange={setIsAddHandOpen}
        onSubmit={handleAddHand}
      />
      
      {editingHand && (
        <HandForm
          open={isEditHandOpen}
          onOpenChange={setIsEditHandOpen}
          onSubmit={handleEditHand}
          initialData={editingHand}
          isEditing
        />
      )}
      
      <AlertDialog open={!!handToDelete} onOpenChange={() => setHandToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the hand record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteHand}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HandManagementPanel;
