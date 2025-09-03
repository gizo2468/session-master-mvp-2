import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HandData } from '@/types/poker';
import { useHandForm } from '@/hooks/useHandForm';
import ImageUploadSection from './HandFormSections/ImageUploadSection';
import GameTypeSection from './HandFormSections/GameTypeSection';
import CardSelectionSection from './HandFormSections/CardSelectionSection';
import PositionSection from './HandFormSections/PositionSection';
import ActionSection from './HandFormSections/ActionSection';
import StreetByStreetSection from './HandFormSections/StreetByStreetSection';
import NotesSection from './HandFormSections/NotesSection';

interface HandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<HandData>) => void;
  initialData?: Partial<HandData>;
  isEditing?: boolean;
  tableId?: string;
  tableFormat?: 'Cash' | 'Tournament';
}

const HandForm: React.FC<HandFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData = {},
  isEditing = false,
  tableId,
  tableFormat
}) => {
  const {
    form,
    selectedPositionIndex,
    isHelpModalOpen,
    setIsHelpModalOpen,
    isFlopOpen,
    setIsFlopOpen,
    isTurnOpen,
    setIsTurnOpen,
    isRiverOpen,
    setIsRiverOpen,
    isShowdownOpen,
    setIsShowdownOpen,
    imagePreview,
    gameType,
    selectedCards,
    flopCards,
    flopAction,
    turnCards,
    turnAction,
    riverCards,
    riverAction,
    villainCards,
    result,
    handlePositionSelect,
    handleSubmit,
    handleImageChange
  } = useHandForm({
    open,
    isEditing,
    initialData,
    tableId,
    onSubmit,
    onOpenChange
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Hand' : 'Add New Hand'}</DialogTitle>
            <DialogDescription>
              Record the details of your poker hand for analysis and tracking.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={(e) => {
              if (e.nativeEvent instanceof KeyboardEvent && e.nativeEvent.key === 'Enter') {
                e.preventDefault();
                return false;
              }
              
              form.handleSubmit(handleSubmit)(e);
            }} className="space-y-6" autoComplete="off">
              
              {/* Circular Image Upload Button */}
              <ImageUploadSection 
                imagePreview={imagePreview}
                onImageChange={handleImageChange}
              />

              {/* Game Type Selection */}
              <GameTypeSection 
                control={form.control}
                gameType={gameType}
              />
              
              {/* Card Selection */}
              <CardSelectionSection 
                control={form.control}
                gameType={gameType}
                flopCards={flopCards}
                turnCards={turnCards}
                riverCards={riverCards}
                villainCards={villainCards}
              />
              
              {/* Position Wheel Selector */}
              <PositionSection 
                control={form.control}
                selectedPositionIndex={selectedPositionIndex}
                onPositionSelect={handlePositionSelect}
              />
              
              {/* Action Type */}
              <ActionSection control={form.control} />
              
              {/* Street-by-Street Analysis */}
              <StreetByStreetSection 
                control={form.control}
                setValue={form.setValue}
                selectedCards={selectedCards}
                gameType={gameType}
                isFlopOpen={isFlopOpen}
                setIsFlopOpen={setIsFlopOpen}
                isTurnOpen={isTurnOpen}
                setIsTurnOpen={setIsTurnOpen}
                isRiverOpen={isRiverOpen}
                setIsRiverOpen={setIsRiverOpen}
                isShowdownOpen={isShowdownOpen}
                setIsShowdownOpen={setIsShowdownOpen}
                flopCards={flopCards}
                turnCards={turnCards}
                riverCards={riverCards}
                villainCards={villainCards}
              />
              
              {/* Notes */}
              <NotesSection control={form.control} />
            </form>
          </Form>
        
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={!selectedCards || selectedCards.length === 0}
              className="bg-poker-gold hover:bg-poker-darkGold text-white"
            >
              {isEditing ? 'Save Changes' : 'Add Hand'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandForm;