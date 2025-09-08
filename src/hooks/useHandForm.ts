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
  const villainCards = form.watch('villainCards');
  const result = form.watch('result');
  
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
    if ((villainCards && villainCards.some(c => c.rank && c.suit)) || result) setIsShowdownOpen(true);
  }, [villainCards, result]);

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
        flopCards: [{ id: 0 }, { id: 1 }, { id: 2 }],
        flopAction: '',
        turnCards: [{ id: 0 }],
        turnAction: '',
        riverCards: [{ id: 0 }],
        riverAction: '',
        villainCards: [{ id: 0 }, { id: 1 }],
        result: '',
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
    const { flopCards: flopCardsArray, turnCards: turnCardsArray, riverCards: riverCardsArray, villainCards: villainCardsArray, ...handData } = values;
    
    // Convert card arrays to strings for storage
    const flopCardsString = flopCardsArray?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit).join('') || '';
    const turnCardsString = turnCardsArray?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit).join('') || '';
    const riverCardsString = riverCardsArray?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit).join('') || '';
    const villainCardsString = villainCardsArray?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit).join('') || '';
    
    onSubmit({
      ...handData,
      id: initialData.id,
      image: imagePreview,
      position: positions[selectedPositionIndex], // Use the position from our wheel picker
      // Store the card data in the expected format
      flopCards: flopCardsString ? [flopCardsString] : undefined,
      turnCard: turnCardsString || undefined,
      riverCard: riverCardsString || undefined,
      showdownResult: values.result || undefined,
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
    villainCards,
    result,
    handlePositionSelect,
    handleSubmit,
    handleImageChange
  };
};