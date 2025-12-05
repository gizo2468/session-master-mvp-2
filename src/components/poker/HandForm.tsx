import React, { useState } from 'react';
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
import HandResultSection from './HandFormSections/HandResultSection';
import AIHandAnalyzerBanner from './AIHandAnalyzerBanner';
import AIHandAnalyzerDialog from './AIHandAnalyzerDialog';
import OpponentLinkSection from './HandFormSections/OpponentLinkSection';
import HandDetailGate from '@/components/ui/HandDetailGate';

interface HandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<HandData>) => void;
  initialData?: Partial<HandData>;
  isEditing?: boolean;
  sessionId: string;
  tableId?: string;
  tableFormat?: 'Cash' | 'Tournament';
}

const HandForm: React.FC<HandFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData = {},
  isEditing = false,
  sessionId,
  tableId,
  tableFormat
}) => {
  const [showAIAnalyzer, setShowAIAnalyzer] = useState(false);
  
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
    isNotesOpen,
    setIsNotesOpen,
    imagePreview,
    gameType,
    selectedCards,
    flopCards,
    flopAction,
    turnCards,
    turnAction,
    riverCards,
    riverAction,
    villains,
    resultValue,
    resultUnit,
    handlePositionSelect,
    handleSubmit,
    handleImageChange,
    handleGlobalUnitChange
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
            }} 
            className="space-y-6" 
            autoComplete="off"
            data-form-type="other"
            data-credential="false"
            data-1p-ignore="true"
            data-lpignore="true"
            data-bwignore="true">
              
              {/* Circular Image Upload Button */}
              <ImageUploadSection 
                imagePreview={imagePreview}
                onImageChange={handleImageChange}
              />

              {/* AI Hand Analyzer - only show when adding new hand, not editing */}
              {!isEditing && (
                <AIHandAnalyzerBanner onClick={() => setShowAIAnalyzer(true)} />
              )}

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
                villains={villains}
              />
              
              {/* Position Wheel Selector */}
              <PositionSection 
                control={form.control}
                selectedPositionIndex={selectedPositionIndex}
                onPositionSelect={handlePositionSelect}
              />
              
              {/* Action Type */}
              <ActionSection control={form.control} />
              
              <AIHandAnalyzerDialog
                open={showAIAnalyzer}
                onOpenChange={setShowAIAnalyzer}
                sessionId={sessionId}
                tableId={tableId}
                tableFormat={tableFormat}
                onHandAdded={() => onOpenChange(false)}
              />
              
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
                villains={villains}
                onGlobalUnitChange={handleGlobalUnitChange}
              />
              
              {/* Link to Opponent from My Notes */}
              <HandDetailGate>
                <OpponentLinkSection control={form.control} />
              </HandDetailGate>
              
              {/* Notes */}
              <NotesSection 
                control={form.control} 
                isNotesOpen={isNotesOpen}
                setIsNotesOpen={setIsNotesOpen}
              />
              
              {/* Hand Result */}
              <HandResultSection 
                control={form.control} 
                setValue={form.setValue}
                onUnitChange={handleGlobalUnitChange}
              />
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