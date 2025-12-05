import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { handFormSchema, FormValues, positions } from '@/utils/handFormHelpers';
import { HandData } from '@/types/poker';

interface UseHandFormProps {
  open: boolean;
  isEditing?: boolean;
  initialData?: Partial<HandData>;
  tableId?: string;
  onSubmit: (data: Partial<HandData>) => void;
  onOpenChange: (open: boolean) => void;
}

export const useHandForm = ({
  open,
  isEditing = false,
  initialData = {},
  tableId,
  onSubmit,
  onOpenChange
}: UseHandFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(handFormSchema),
    defaultValues: {
      cards: initialData.cards || '',
      position: initialData.position || '',
      action: initialData.action || 'Open / Flat',
      notes: initialData.notes || '',
      pokercraftLink: initialData.pokercraftLink || '',
      image: initialData.image || undefined,
      gameType: initialData.gameType || 'NLH',
      tableId: tableId || initialData.tableId,
      bigBlind: initialData.bigBlind || undefined,
      // Multi-villain support - convert legacy data if present
      villains: initialData.villains ? initialData.villains.map(v => ({
        cards: [],
        position: v.position || '',
        bigBlind: v.bigBlind
      })) : (initialData.villainHand || initialData.villainPosition || initialData.villainBigBlind) ? 
        [{
          cards: [],
          position: initialData.villainPosition || '',
          bigBlind: initialData.villainBigBlind
        }] : 
        [{ cards: [], position: '', bigBlind: undefined }],
      // Legacy fields for backward compatibility
      villainBigBlind: initialData.villainBigBlind || undefined,
      villainPosition: initialData.villainPosition || '',
      opponentProfileId: initialData.opponentProfileId || undefined,
    }
  });
  
  // Position selector state - simplified approach now
  const [selectedPositionIndex, setSelectedPositionIndex] = useState(0);
  
  // Help modal state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  // Collapsible section states
  const [isFlopOpen, setIsFlopOpen] = useState(false);
  const [isTurnOpen, setIsTurnOpen] = useState(false);
  const [isRiverOpen, setIsRiverOpen] = useState(false);
  const [isShowdownOpen, setIsShowdownOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  
  // Image preview state
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData.image || null
  );
  
  // Get current form values for reactive UI updates
  const gameType = form.watch('gameType');
  const selectedCards = form.watch('cards');
  
  // Watch form values to auto-expand sections when data is input
  const flopCards = form.watch('flopCards');
  const flopAction = form.watch('flopAction');
  const turnCards = form.watch('turnCards');
  const turnAction = form.watch('turnAction');
  const riverCards = form.watch('riverCards');
  const riverAction = form.watch('riverAction');
  const villains = form.watch('villains');
  const resultValue = form.watch('resultValue');
  const resultUnit = form.watch('resultUnit');
  const bigBlind = form.watch('bigBlind');
  
  // Handle global unit change - convert all values across the hand
  const handleGlobalUnitChange = (newUnit: 'BB' | 'Chips') => {
    const bb = bigBlind || 1;
    const currentUnit = form.getValues('resultUnit');
    
    if (currentUnit === newUnit) return;
    
    // Helper to convert value
    const convert = (val: number | undefined): number | undefined => {
      if (val === undefined) return undefined;
      if (newUnit === 'Chips') {
        return Math.round(val * bb);
      } else {
        return Math.round((val / bb) * 100) / 100;
      }
    };
    
    // Helper to convert actions array
    const convertActions = (actions: any[]) => {
      if (!actions) return [];
      return actions.map(action => ({
        ...action,
        unit: newUnit,
        size: action.size !== undefined ? convert(action.size) : undefined
      }));
    };
    
    // Convert result value
    const currentResultValue = form.getValues('resultValue');
    if (currentResultValue !== undefined) {
      form.setValue('resultValue', convert(currentResultValue) ?? 0);
    }
    
    // Convert all street actions
    const flopActionsVal = form.getValues('flopActions');
    const turnActionsVal = form.getValues('turnActions');
    const riverActionsVal = form.getValues('riverActions');
    
    if (flopActionsVal) {
      form.setValue('flopActions', convertActions(flopActionsVal));
    }
    if (turnActionsVal) {
      form.setValue('turnActions', convertActions(turnActionsVal));
    }
    if (riverActionsVal) {
      form.setValue('riverActions', convertActions(riverActionsVal));
    }
    
    // Update global unit
    form.setValue('resultUnit', newUnit);
  };
  
  // Set initial position index if editing
  useEffect(() => {
    if (initialData.position) {
      const index = positions.findIndex(pos => pos === initialData.position);
      if (index !== -1) {
        setSelectedPositionIndex(index);
        form.setValue('position', positions[index]);
      }
    }
  }, [initialData.position, form]);

  // Handle position selection
  const handlePositionSelect = (index: number) => {
    setSelectedPositionIndex(index);
    form.setValue('position', positions[index]);
  };
  
  // Auto-expand sections when data is input
  useEffect(() => {
    if ((flopCards && flopCards.some(c => c.rank && c.suit)) || flopAction) setIsFlopOpen(true);
  }, [flopCards, flopAction]);
  
  useEffect(() => {
    if ((turnCards && turnCards.some(c => c.rank && c.suit)) || turnAction) setIsTurnOpen(true);
  }, [turnCards, turnAction]);
  
  useEffect(() => {
    if ((riverCards && riverCards.some(c => c.rank && c.suit)) || riverAction) setIsRiverOpen(true);
  }, [riverCards, riverAction]);
  
  useEffect(() => {
    const hasVillainData = villains?.some(v => v.cards?.some((c: any) => c.rank && c.suit));
    if (hasVillainData) setIsShowdownOpen(true);
  }, [villains]);

  // Clear cards when game type changes to prevent validation issues
  useEffect(() => {
    if (open && !isEditing) {
      form.setValue('cards', '');
    }
  }, [gameType, open, isEditing, form]);
  
  useEffect(() => {
    if (open && !isEditing) {
      form.reset({
        cards: '',
        position: '',
        action: 'Open / Flat',
        notes: '',
        pokercraftLink: '',
        image: undefined,
        gameType: 'NLH',
        tableId: tableId,
        bigBlind: undefined,
        flopCards: [{ id: 0 }, { id: 1 }, { id: 2 }],
        flopAction: '',
        turnCards: [{ id: 0 }],
        turnAction: '',
        riverCards: [{ id: 0 }],
        riverAction: '',
        villains: [{ cards: [], position: '', bigBlind: undefined }],
        villainBigBlind: undefined,
        villainPosition: '',
        resultValue: undefined,
        resultUnit: 'BB',
        opponentProfileId: undefined,
      });
      setImagePreview(null);
      setSelectedPositionIndex(0);
      // Reset collapsible states
      setIsFlopOpen(false);
      setIsTurnOpen(false);
      setIsRiverOpen(false);
      setIsShowdownOpen(false);
    }
  }, [open, isEditing, form, tableId]);
  
  const handleSubmit = (values: FormValues) => {
    console.log('🔍 SUBMIT: Form submission with values:', {
      gameType: values.gameType,
      cardCount: values.cards.length / 2,
      cards: values.cards
    });
    
    // Only validate card count for the game type
    const requiredCardCount = values.gameType === 'NLH' ? 2 : 4;
    const maxCardCount = values.gameType === 'NLH' ? 2 : 6;
    const currentCardCount = values.cards.length / 2;
    
    console.log('🔍 VALIDATION: Card count check:', {
      gameType: values.gameType,
      currentCardCount,
      requiredCardCount,
      maxCardCount,
      isValid: currentCardCount >= requiredCardCount && currentCardCount <= maxCardCount
    });
    
    if (currentCardCount < requiredCardCount || currentCardCount > maxCardCount) {
      const gameTypeName = values.gameType === 'NLH' ? 'Texas Hold\'em' : 'Omaha';
      const cardMessage = values.gameType === 'NLH' 
        ? `Select exactly ${requiredCardCount} cards for ${gameTypeName}`
        : `Select between ${requiredCardCount}-${maxCardCount} cards for ${gameTypeName}`;
        
      form.setError("cards", {
        type: "manual", 
        message: cardMessage
      });
      return;
    }
    
    // Exclude premium fields that have type mismatches for now - convert cards to strings for storage
    const { flopCards: flopCardsArray, turnCards: turnCardsArray, riverCards: riverCardsArray, villains: villainsArray, ...handData } = values;
    
    // Convert card arrays to strings for storage
    const flopCardsString = flopCardsArray?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit).join('') || '';
    const turnCardsString = turnCardsArray?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit).join('') || '';
    const riverCardsString = riverCardsArray?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit).join('') || '';
    
    // Convert villains array to storage format
    const villainsData = villainsArray?.map(v => ({
      hand: v.cards?.filter((c: any) => c.rank && c.suit).map((c: any) => c.rank + c.suit).join('') || '',
      bigBlind: v.bigBlind,
      position: v.position
    })).filter(v => v.hand || v.position || v.bigBlind) || [];
    
    onSubmit({
      ...handData,
      id: initialData.id,
      image: imagePreview,
      position: positions[selectedPositionIndex], // Use the position from our wheel picker
      bigBlind: values.bigBlind,
      // Store the card data in the expected format
      flopCards: flopCardsString ? [flopCardsString] : undefined,
      turnCard: turnCardsString || undefined,
      riverCard: riverCardsString || undefined,
      villains: villainsData.length > 0 ? villainsData : undefined,
      showdownResult: values.resultValue !== undefined 
        ? `${values.resultValue > 0 ? '+' : ''}${values.resultValue} ${values.resultUnit}` 
        : undefined,
      opponentProfileId: values.opponentProfileId,
    });
    onOpenChange(false);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return {
    form,
    selectedPositionIndex,
    setSelectedPositionIndex,
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
    setImagePreview,
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
  };
};