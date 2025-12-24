
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { HandData, TableData } from '@/types/poker';
import HandsList from './HandsList';
import HandForm from './HandForm';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface PastTableHandsPanelProps {
  table: TableData;
  onTableUpdate: (hands: HandData[]) => void;
}

const PastTableHandsPanel: React.FC<PastTableHandsPanelProps> = ({ 
  table,
  onTableUpdate
}) => {
  const [isAddHandOpen, setIsAddHandOpen] = useState(false);
  const [isEditHandOpen, setIsEditHandOpen] = useState(false);
  const [editingHand, setEditingHand] = useState<HandData | null>(null);
  const [handToDelete, setHandToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const hands = table.hands || [];

  const handleAddHand = (handData: Partial<HandData>) => {
    try {
      const newHand: HandData = {
        ...handData,
        id: uuidv4(),
        createdAt: new Date(),
        tableId: table.id,
        // Auto-determine currency type based on table format
        currencyType: table.format === 'Cash' ? 'currency' : 'chips'
      } as HandData;
      
      const updatedHands = [...hands, newHand];
      onTableUpdate(updatedHands);
      
      toast({
        title: 'Hand Added',
        description: 'Your hand has been successfully added.',
      });
      setIsAddHandOpen(false);
    } catch (error) {
      toast({
        title: 'Error Adding Hand',
        description: 'There was a problem saving the hand data.',
        variant: 'destructive'
      });
      console.error("Error adding hand:", error);
    }
  };
  
  const handleEditHand = (handData: Partial<HandData>) => {
    if (editingHand && handData.id) {
      try {
        const updatedHandData = {
          ...editingHand,
          ...handData,
        };
        
        // Ensure image is preserved if it wasn't changed
        if (handData.image === undefined && editingHand.image) {
          updatedHandData.image = editingHand.image;
        }
        
        const updatedHands = hands.map(h => 
          h.id === handData.id ? updatedHandData : h
        );
        
        onTableUpdate(updatedHands);
        
        toast({
          title: 'Hand Updated',
          description: 'Your hand has been successfully updated.',
        });
      } catch (error) {
        toast({
          title: 'Error Updating Hand',
          description: 'There was a problem saving the updated hand data.',
          variant: 'destructive'
        });
        console.error("Error updating hand:", error);
      }
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
      try {
        const updatedHands = hands.filter(h => h.id !== handToDelete);
        onTableUpdate(updatedHands);
        
        setHandToDelete(null);
        toast({
          title: 'Hand Deleted',
          description: 'Your hand has been successfully deleted.',
        });
      } catch (error) {
        toast({
          title: 'Error Deleting Hand',
          description: 'There was a problem deleting the hand.',
          variant: 'destructive'
        });
        console.error("Error deleting hand:", error);
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-extrabold tracking-tight">Hands Played</h3>
        <Button 
          onClick={() => setIsAddHandOpen(true)}
          variant="lightyellow"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          Add Hand
        </Button>
      </div>
      
      <HandsList 
        hands={hands} 
        onEditHand={onEditHand}
        onDeleteHand={onDeleteHand}
        readOnly={false}
      />
      
      <HandForm
        open={isAddHandOpen}
        onOpenChange={setIsAddHandOpen}
        onSubmit={handleAddHand}
        sessionId={table.session_id || table.id}
        tableId={table.id}
        tableFormat={table.format}
      />
      
      {editingHand && (
        <HandForm
          open={isEditHandOpen}
          onOpenChange={setIsEditHandOpen}
          onSubmit={handleEditHand}
          initialData={editingHand}
          sessionId={table.session_id || table.id}
          tableId={editingHand.tableId}
          tableFormat={table.format}
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

export default PastTableHandsPanel;
