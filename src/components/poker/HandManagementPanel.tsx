
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, ChevronRight } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import CardDisplay from './CardDisplay';
import HandDetailsDialog from './HandDetailsDialog';
import { format } from 'date-fns';

interface HandManagementPanelProps {
  sessionId: string;
  hands?: HandData[];
  tables?: TableData[];
  tableId?: string;
  tableFormat?: 'Cash' | 'Tournament';
  readOnly?: boolean;
  sessionBuyIn?: number;
  previewLimit?: number; // When set, shows only this many hands + "View all" button
}

const HandManagementPanel: React.FC<HandManagementPanelProps> = ({ 
  sessionId,
  hands = [],
  tables = [],
  tableId,
  tableFormat,
  readOnly = false,
  sessionBuyIn,
  previewLimit
}) => {
  const [isAddHandOpen, setIsAddHandOpen] = useState(false);
  const [isEditHandOpen, setIsEditHandOpen] = useState(false);
  const [editingHand, setEditingHand] = useState<HandData | null>(null);
  const [handToDelete, setHandToDelete] = useState<string | null>(null);
  const [showAllHandsModal, setShowAllHandsModal] = useState(false);
  const [selectedHandForDetails, setSelectedHandForDetails] = useState<HandData | null>(null);
  const [showHandDetails, setShowHandDetails] = useState(false);
  
  const { addHand, updateHand, deleteHand, addTableHand, updateTableHand, deleteTableHand, getTableById } = useSessionContext();
  const { toast } = useToast();
  
  // Get hands based on the specified table or show all hands
  const getDisplayedHands = (): HandData[] => {
    if (tableId) {
      // If a tableId is provided, only show hands for that specific table
      return hands.filter(h => h.tableId === tableId);
    } else {
      // If no tableId is provided, show all hands from this session
      return hands;
    }
  };

  const handleAddHand = (handData: Partial<HandData>) => {
    try {
      if (tableId) {
        // Add to table level
        const { tableId: _, ...restHandData } = handData;
        addTableHand(
          sessionId, 
          tableId, 
          restHandData as Omit<HandData, 'id' | 'createdAt' | 'tableId'>
        );
      } else {
        // Add to session level (legacy support)
        addHand(sessionId, handData as Omit<HandData, 'id' | 'createdAt'>);
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
          tables?.flatMap(t => t.hands || []).find(h => h.id === handToDelete);
        
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
  const sortedHands = [...displayedHands].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const previewHands = previewLimit ? sortedHands.slice(0, previewLimit) : sortedHands;
  const hasMoreHands = previewLimit && sortedHands.length > previewLimit;

  const handleHandClick = (hand: HandData) => {
    setSelectedHandForDetails(hand);
    setShowHandDetails(true);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-extrabold tracking-tight">Hands Played</h3>
        {!readOnly && (
          <Button 
            onClick={() => setIsAddHandOpen(true)}
            variant="lightyellow"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" /> 
            Add Hand
          </Button>
        )}
      </div>
      
      {/* Show card-style preview if previewLimit is set */}
      {previewLimit ? (
        <div className="space-y-3">
          {previewHands.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hands recorded yet
            </p>
          ) : (
            <>
              {previewHands.map((hand) => (
                <div
                  key={hand.id}
                  onClick={() => handleHandClick(hand)}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(hand.createdAt), 'MMM d, yyyy')}
                      </span>
                      {hand.position && (
                        <span className="text-xs font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          {hand.position}
                        </span>
                      )}
                    </div>
                    {hand.cards && (
                      <div className="flex items-center gap-2">
                        <CardDisplay cards={hand.cards} size="sm" />
                      </div>
                    )}
                    {hand.action && (
                      <div className="text-xs text-muted-foreground">
                        {hand.action.substring(0, 50)}
                        {hand.action.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
              
              {hasMoreHands && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllHandsModal(true)}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View all hands ({sortedHands.length})
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        /* Original table view for backward compatibility */
        <HandsList 
          hands={sortedHands} 
          onEditHand={onEditHand}
          onDeleteHand={onDeleteHand}
          readOnly={readOnly}
          sessionBuyIn={sessionBuyIn}
          tables={tables}
        />
      )}
      
      {!readOnly && ( // Only render form components if not in read-only mode
        <>
          <HandForm
            open={isAddHandOpen}
            onOpenChange={setIsAddHandOpen}
            onSubmit={handleAddHand}
            sessionId={sessionId}
            tableId={tableId}
            tableFormat={tableFormat}
          />
          
          {editingHand && (
            <HandForm
              open={isEditHandOpen}
              onOpenChange={setIsEditHandOpen}
              onSubmit={handleEditHand}
              initialData={editingHand}
              sessionId={sessionId}
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
        </>
      )}

      {/* All Hands Modal */}
      <Dialog open={showAllHandsModal} onOpenChange={setShowAllHandsModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>All Hands</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {sortedHands.map((hand) => (
                <div
                  key={hand.id}
                  onClick={() => {
                    setSelectedHandForDetails(hand);
                    setShowHandDetails(true);
                    setShowAllHandsModal(false);
                  }}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(hand.createdAt), 'MMM d, yyyy')}
                      </span>
                      {hand.position && (
                        <span className="text-xs font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          {hand.position}
                        </span>
                      )}
                    </div>
                    {hand.cards && (
                      <div className="flex items-center gap-2">
                        <CardDisplay cards={hand.cards} size="sm" />
                      </div>
                    )}
                    {hand.action && (
                      <div className="text-xs text-muted-foreground">
                        {hand.action.substring(0, 50)}
                        {hand.action.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Hand Details Dialog */}
      <HandDetailsDialog
        open={showHandDetails}
        onOpenChange={(open) => {
          setShowHandDetails(open);
          if (!open) {
            setSelectedHandForDetails(null);
          }
        }}
        hand={selectedHandForDetails}
        sessionBuyIn={sessionBuyIn}
        tables={tables}
      />
    </div>
  );
};

export default HandManagementPanel;
