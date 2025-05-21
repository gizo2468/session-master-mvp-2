
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { HandData, TableData } from '@/types/poker';
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
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HandManagementPanelProps {
  sessionId: string;
  hands?: HandData[];
  tables?: TableData[];
}

const HandManagementPanel: React.FC<HandManagementPanelProps> = ({ 
  sessionId,
  hands = [],
  tables = []
}) => {
  const [isAddHandOpen, setIsAddHandOpen] = useState(false);
  const [isEditHandOpen, setIsEditHandOpen] = useState(false);
  const [editingHand, setEditingHand] = useState<HandData | null>(null);
  const [handToDelete, setHandToDelete] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | 'session'>('session');
  
  const { addHand, updateHand, deleteHand, addTableHand, updateTableHand, deleteTableHand, getTableById } = useSessionContext();
  const { toast } = useToast();
  
  // Get hands based on the selected table
  const getDisplayedHands = (): HandData[] => {
    if (selectedTableId === 'session') {
      // Filter hands that don't belong to any table
      return hands.filter(h => !h.tableId);
    } else if (tables) {
      const selectedTable = tables.find(t => t.id === selectedTableId);
      return selectedTable?.hands || [];
    }
    return [];
  };
  
  const getTableFormat = (tableId: string): 'Cash' | 'Tournament' | undefined => {
    if (tableId === 'session') return undefined;
    const table = tables.find(t => t.id === tableId);
    return table?.format;
  };

  const handleAddHand = (handData: Partial<HandData>) => {
    try {
      if (selectedTableId === 'session') {
        // Add to session level
        addHand(sessionId, handData as Omit<HandData, 'id' | 'createdAt'>);
      } else {
        // Add to table level
        const { tableId, ...restHandData } = handData;
        addTableHand(
          sessionId, 
          selectedTableId, 
          restHandData as Omit<HandData, 'id' | 'createdAt' | 'tableId'>
        );
      }
      
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
        
        if (updatedHandData.tableId) {
          updateTableHand(sessionId, updatedHandData.tableId, updatedHandData);
        } else {
          updateHand(sessionId, updatedHandData);
        }
        
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
        // Find which table this hand belongs to (if any)
        const handToDeleteObj = hands.find(h => h.id === handToDelete) || 
          tables.flatMap(t => t.hands || []).find(h => h.id === handToDelete);
        
        if (handToDeleteObj?.tableId) {
          deleteTableHand(sessionId, handToDeleteObj.tableId, handToDelete);
        } else {
          deleteHand(sessionId, handToDelete);
        }
        
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
  
  const displayedHands = getDisplayedHands();
  const tableFormat = getTableFormat(selectedTableId);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-extrabold tracking-tight">Hands Played</h3>
        <Button 
          onClick={() => setIsAddHandOpen(true)}
          className="bg-poker-gold hover:bg-poker-darkGold text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          Add Hand
        </Button>
      </div>
      
      {/* Table Selector */}
      {tables && tables.length > 0 && (
        <div className="mb-4">
          <Select 
            value={selectedTableId}
            onValueChange={setSelectedTableId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select table to view hands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="session">Session Level Hands</SelectItem>
              {tables.map(table => (
                <SelectItem key={table.id} value={table.id}>
                  {table.name || `${table.format} - ${table.gameType}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <HandsList 
        hands={displayedHands} 
        onEditHand={onEditHand}
        onDeleteHand={onDeleteHand}
      />
      
      <HandForm
        open={isAddHandOpen}
        onOpenChange={setIsAddHandOpen}
        onSubmit={handleAddHand}
        tableId={selectedTableId !== 'session' ? selectedTableId : undefined}
        tableFormat={tableFormat}
      />
      
      {editingHand && (
        <HandForm
          open={isEditHandOpen}
          onOpenChange={setIsEditHandOpen}
          onSubmit={handleEditHand}
          initialData={editingHand}
          tableId={editingHand.tableId}
          tableFormat={editingHand.tableId ? getTableById(sessionId, editingHand.tableId)?.format : undefined}
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
