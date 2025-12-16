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
  // Helper to parse card string like "AsKh" into card slot array
  const parseCardString = (cardStr: string | undefined): Array<{ id: number; rank?: string; suit?: string }> => {
    if (!cardStr) return [];
    const cards: Array<{ id: number; rank?: string; suit?: string }> = [];
    for (let i = 0; i < cardStr.length; i += 2) {
      if (i + 1 < cardStr.length) {
        cards.push({ id: cards.length, rank: cardStr[i], suit: cardStr[i + 1] });
      }
    }
    return cards;
  };

  // Helper to convert villain data from DB format to form format
  const parseVillainsForForm = (villains: any[] | undefined) => {
    if (!villains || villains.length === 0) {
      return [{ cards: [], position: '', bigBlind: undefined }];
    }
    return villains.map(v => ({
      cards: parseCardString(v.hand),
      position: v.position || '',
      bigBlind: v.bigBlind
    }));
  };

  // Parse board cards from initialData
  const parseFlopCards = () => {
    if (initialData.flopCards && initialData.flopCards.length > 0) {
      const flopStr = Array.isArray(initialData.flopCards) ? initialData.flopCards[0] : initialData.flopCards;
      const parsed = parseCardString(flopStr as string);
      // Ensure exactly 3 slots for flop
      while (parsed.length < 3) parsed.push({ id: parsed.length });
      return parsed.slice(0, 3);
    }
    return [{ id: 0 }, { id: 1 }, { id: 2 }];
  };

  const parseTurnCards = () => {
    if (initialData.turnCard) {
      const parsed = parseCardString(initialData.turnCard);
      return parsed.length > 0 ? parsed : [{ id: 0 }];
    }
    return [{ id: 0 }];
  };

  const parseRiverCards = () => {
    if (initialData.riverCard) {
      const parsed = parseCardString(initialData.riverCard);
      return parsed.length > 0 ? parsed : [{ id: 0 }];
    }
    return [{ id: 0 }];
  };

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
      smallBlind: initialData.smallBlind || undefined,
      bigBlind: initialData.bigBlind || undefined,
      heroStackBB: initialData.heroStackBB || undefined,
      // Board cards for edit mode
      flopCards: parseFlopCards(),
      turnCards: parseTurnCards(),
      riverCards: parseRiverCards(),
      // Structured actions for edit mode (cast to any to handle DB string types)
      preflopActions: (initialData.preflopActions as any) || [],
      flopActions: (initialData.flopActions as any) || [],
      turnActions: (initialData.turnActions as any) || [],
      riverActions: (initialData.riverActions as any) || [],
      // Hand result
      resultValue: initialData.resultValue,
      resultUnit: initialData.resultUnit || 'BB',
      // Multi-villain support - convert from DB format
      villains: parseVillainsForForm(initialData.villains),
      // Legacy fields for backward compatibility
      villainBigBlind: initialData.villainBigBlind || undefined,
      villainPosition: initialData.villainPosition || '',
      opponentProfileId: initialData.opponentProfileId || undefined,
      opponentProfileIds: initialData.opponentProfileIds || [],
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
  const smallBlind = form.watch('smallBlind');
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
    const preflopActionsVal = form.getValues('preflopActions');
    const flopActionsVal = form.getValues('flopActions');
    const turnActionsVal = form.getValues('turnActions');
    const riverActionsVal = form.getValues('riverActions');
    
    if (preflopActionsVal) {
      form.setValue('preflopActions', convertActions(preflopActionsVal));
    }
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
        smallBlind: undefined,
        bigBlind: undefined,
        heroStackBB: undefined,
        preflopActions: [],
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
        opponentProfileIds: [],
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
      smallBlind: values.smallBlind,
      bigBlind: values.bigBlind,
      heroStackBB: values.heroStackBB,
      gameType: values.gameType,
      // Store the card data in the expected format
      flopCards: flopCardsString ? [flopCardsString] : undefined,
      turnCard: turnCardsString || undefined,
      riverCard: riverCardsString || undefined,
      villains: villainsData.length > 0 ? villainsData : undefined,
      // Structured actions (cast to match HandData type)
      preflopActions: values.preflopActions as any,
      flopActions: values.flopActions as any,
      turnActions: values.turnActions as any,
      riverActions: values.riverActions as any,
      // Hand result
      resultValue: values.resultValue,
      resultUnit: values.resultUnit,
      showdownResult: values.resultValue !== undefined 
        ? `${values.resultValue > 0 ? '+' : ''}${values.resultValue} ${values.resultUnit}` 
        : undefined,
      opponentProfileId: values.opponentProfileIds?.[0] || values.opponentProfileId, // Keep first for legacy compatibility
      opponentProfileIds: values.opponentProfileIds,
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
    smallBlind,
    bigBlind,
    handlePositionSelect,
    handleSubmit,
    handleImageChange,
    handleGlobalUnitChange
  };
};