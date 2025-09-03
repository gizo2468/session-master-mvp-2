import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import CardSelector from './CardSelector';
import CardSlotPicker from './CardSlotPicker';
import { HandData } from '@/types/poker';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/Lucide';
import { PokerChip } from '../Icons';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { CircleHelp, Camera, ChevronDown, Trash2 } from 'lucide-react';
import HandDetailGate from '@/components/ui/HandDetailGate';
import { useIsMobile } from '@/hooks/use-mobile';

interface HandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<HandData>) => void;
  initialData?: Partial<HandData>;
  isEditing?: boolean;
  tableId?: string;
  tableFormat?: 'Cash' | 'Tournament';
}

// Updated schema to make only Cards required
const handFormSchema = z.object({
  cards: z.string().min(2, 'Select at least 1 card').max(12, 'Maximum 6 cards'),
  position: z.string().optional(),
  action: z.string().optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  pokercraftLink: z.string().url('Invalid URL format').optional().or(z.literal('')),
  image: z.string().optional().or(z.any().optional()),
  gameType: z.enum(['NLH', 'PLO']).default('NLH'),
  tableId: z.string().optional(),
  // Premium hand detail fields - updated for card slot structure
  flopCards: z.array(z.object({
    id: z.number(),
    rank: z.string().optional(),
    suit: z.string().optional(),
  })).default([{ id: 0 }, { id: 1 }, { id: 2 }]),
  flopAction: z.string().optional(),
  turnCards: z.array(z.object({
    id: z.number(),
    rank: z.string().optional(),
    suit: z.string().optional(),
  })).default([{ id: 0 }]),
  turnAction: z.string().optional(),
  riverCards: z.array(z.object({
    id: z.number(),
    rank: z.string().optional(),
    suit: z.string().optional(),
  })).default([{ id: 0 }]),
  riverAction: z.string().optional(),
  villainCards: z.array(z.object({
    id: z.number(),
    rank: z.string().optional(),
    suit: z.string().optional(),
  })).default([]),
  result: z.string().optional(),
});

type FormValues = z.infer<typeof handFormSchema>;

const HandForm: React.FC<HandFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData = {},
  isEditing = false,
  tableId,
  tableFormat
}) => {
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
  const isMobile = useIsMobile();
  
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
  
  // Position options - updated to follow standard poker table order
  const positions = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  
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
  
  // Determine max cards based on game type
  const getMaxCards = (): number => {
    if (gameType === 'NLH') return 2;
    if (gameType === 'PLO') return 6;
    return 6;
  };
  
  const actionTypes = [
    { label: 'Open / Flat', value: 'Open / Flat' },
    { label: '3Bet', value: '3Bet' },
    { label: '4Bet', value: '4Bet' },
    { label: 'BvB', value: 'BvB' }
  ];
  
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData.image || null
  );
  
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
        villainCards: gameType === 'NLH' ? [{ id: 0 }, { id: 1 }] : [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
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
    // Only validate card count for the game type
    const requiredCardCount = gameType === 'NLH' ? 2 : 4;
    
    if ((values.cards.length / 2) < requiredCardCount) {
      form.setError("cards", {
        type: "manual", 
        message: `Select at least ${requiredCardCount} cards for ${gameType === 'NLH' ? 'Texas Hold\'em' : 'Omaha'}`
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
  
  // Tooltip content definitions
  const tooltipContent = {
    cards: "Select cards by clicking on them in the grid. Click selected cards to remove them. For Hold'em, select exactly 2 cards. For Omaha, select 4-6 cards.",
    image: "Upload an image of your hand from the table. Common formats like JPG, PNG and WEBP are accepted. Maximum file size is 5MB.",
    videoLink: "Paste a link to a video of your hand from YouTube, Twitch, or a hand replay from a poker site like PokerCraft.",
    position: "Your position at the table relative to the dealer button. This affects your strategic options and expected ranges.",
    action: "The type of betting action you took with this hand. Open/Flat means opening the pot or calling. 3Bet means raising a previous raise."
  };
  
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
                <div className="flex flex-col items-center gap-3 py-4">
                  <div 
                    className="relative w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all duration-200 cursor-pointer group bg-muted/20 hover:bg-muted/40 flex items-center justify-center"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    {imagePreview ? (
                      <>
                        <img 
                          src={imagePreview} 
                          alt="Hand preview" 
                          className="w-full h-full rounded-full object-cover"
                        />
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {imagePreview ? "Change Image" : "Add Hand Image"}
                  </span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Game Type Selection */}
                <FormField
                  control={form.control}
                  name="gameType"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Game Type</FormLabel>
                        <AdaptiveTooltip content={tooltipContent.cards}>
                          <CircleHelp className="h-4 w-4 text-gray-500" />
                        </AdaptiveTooltip>
                      </div>
                      <FormControl>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => field.onChange('NLH')}
                            className={`flex-1 py-2 px-4 rounded-full transition-all ${
                              field.value === 'NLH' 
                                ? 'bg-poker-gold text-white' 
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            Texas Hold'em
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange('PLO')}
                            className={`flex-1 py-2 px-4 rounded-full transition-all ${
                              field.value === 'PLO' 
                                ? 'bg-poker-gold text-white' 
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            Omaha
                          </button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {gameType === 'NLH' 
                          ? 'Texas Hold\'em - select exactly 2 cards' 
                          : 'Omaha - select between 4-6 cards depending on variant'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Card Selection */}
                <FormField
                  control={form.control}
                  name="cards"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Cards</FormLabel>
                        <AdaptiveTooltip content={tooltipContent.cards}>
                          <CircleHelp className="h-4 w-4 text-gray-500" />
                        </AdaptiveTooltip>
                      </div>
                      <FormControl>
                        <CardSelector 
                          selectedCards={field.value} 
                          onChange={field.onChange}
                          maxCards={getMaxCards()}
                        />
                      </FormControl>
                      <FormDescription>
                        {gameType === 'NLH' 
                          ? 'Select exactly 2 cards - click a card to remove it' 
                          : 'Select between 4-6 cards - click a card to remove it'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Position Wheel Selector - with updated positions */}
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Position</FormLabel>
                        <AdaptiveTooltip content={tooltipContent.position}>
                          <CircleHelp className="h-4 w-4 text-gray-500" />
                        </AdaptiveTooltip>
                      </div>
                      
                      {/* iOS-style wheel picker */}
                      <FormControl>
                        <div className="relative flex justify-center w-full h-[130px] overflow-hidden">
                          <div className="absolute inset-0 pointer-events-none z-10">
                            <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 h-[30px] border-y border-transparent"></div>
                          </div>
                          
                          <div className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scrollbar-none">
                            {/* Empty spaces at top and bottom to allow centering */}
                            <div className="h-[50px]" aria-hidden="true"></div>
                            
                            {positions.map((position, index) => (
                              <div
                                key={position}
                                className={`flex items-center justify-center h-[30px] snap-center cursor-pointer transition-all ${
                                  selectedPositionIndex === index 
                                    ? 'font-bold text-poker-gold' 
                                    : 'text-gray-500'
                                }`}
                                onClick={() => handlePositionSelect(index)}
                              >
                                {position}
                              </div>
                            ))}
                            
                            {/* Empty spaces at top and bottom to allow centering */}
                            <div className="h-[50px]" aria-hidden="true"></div>
                          </div>
                        </div>
                      </FormControl>
                      
                      <FormDescription>
                        Your position at the table
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                
                {/* Video Link */}
                <FormField
                  control={form.control}
                  name="pokercraftLink"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Add Video Link</FormLabel>
                        <AdaptiveTooltip content={tooltipContent.videoLink}>
                          <CircleHelp className="h-4 w-4 text-gray-500" />
                        </AdaptiveTooltip>
                      </div>
                      <FormControl>
                        <Input 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Premium Street-by-Street Analysis */}
                <HandDetailGate>
                  <div className="space-y-6 border-t pt-6">
                    <div className="flex items-center justify-center gap-2">
                      <h4 className="font-semibold text-lg">Street-by-Street</h4>
                      <CircleHelp 
                        className="h-4 w-4 text-gray-500 cursor-pointer" 
                        onClick={() => setIsHelpModalOpen(true)}
                      />
                    </div>
                    
                    {/* Preflop Action - Moved from above */}
                    <FormField
                      control={form.control}
                      name="action"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preflop Action</FormLabel>
                          <FormControl>
                            <ToggleGroup 
                              type="single" 
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex flex-wrap justify-between gap-2"
                            >
                              {actionTypes.map(actionType => (
                                <ToggleGroupItem 
                                  key={actionType.value} 
                                  value={actionType.value}
                                  variant="outline"
                                  className={`flex-1 min-w-[110px] py-2 ${field.value === actionType.value ? 
                                    'bg-poker-feltGreen text-white' : 
                                    'bg-white'}`}
                                >
                                  {actionType.label}
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Flop Analysis - Collapsible */}
                    <Collapsible open={isFlopOpen} onOpenChange={setIsFlopOpen}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
                          <span>Flop</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFlopOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        {isMobile ? (
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="flopCards"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Flop Cards</FormLabel>
                                  <FormControl>
                                    <CardSlotPicker
                                      slots={3}
                                      selectedCards={field.value || [{ id: 0 }, { id: 1 }, { id: 2 }]}
                                      onChange={field.onChange}
                                      excludedCards={selectedCards.match(/.{2}/g) || []}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="flopAction"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Flop Action</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="flopCards"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Flop Cards</FormLabel>
                                  <FormControl>
                                    <CardSlotPicker
                                      slots={3}
                                      selectedCards={field.value || [{ id: 0 }, { id: 1 }, { id: 2 }]}
                                      onChange={field.onChange}
                                      excludedCards={selectedCards.match(/.{2}/g) || []}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="flopAction"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Flop Action</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Turn Analysis - Collapsible */}
                    <Collapsible open={isTurnOpen} onOpenChange={setIsTurnOpen}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
                          <span>Turn</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isTurnOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="turnCards"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Turn Card</FormLabel>
                                <FormControl>
                                  <CardSlotPicker
                                    slots={1}
                                    selectedCards={field.value || [{ id: 0 }]}
                                    onChange={field.onChange}
                                    excludedCards={[
                                      ...(selectedCards.match(/.{2}/g) || []),
                                      ...((flopCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || [])
                                    ]}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="turnAction"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Turn Action</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* River Analysis - Collapsible */}
                    <Collapsible open={isRiverOpen} onOpenChange={setIsRiverOpen}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
                          <span>River</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isRiverOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="riverCards"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>River Card</FormLabel>
                                <FormControl>
                                  <CardSlotPicker
                                    slots={1}
                                    selectedCards={field.value || [{ id: 0 }]}
                                    onChange={field.onChange}
                                    excludedCards={[
                                      ...(selectedCards.match(/.{2}/g) || []),
                                      ...((flopCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                                      ...((turnCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || [])
                                    ]}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="riverAction"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>River Action</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Showdown Result - Collapsible */}
                    <Collapsible open={isShowdownOpen} onOpenChange={setIsShowdownOpen}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between w-full py-2 text-poker-gold font-bold hover:text-poker-darkGold transition-colors">
                          <span>Showdown Result</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isShowdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        <div className="space-y-4">
                          {/* Board Cards Display */}
                          <div>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-base">Board</FormLabel>
                              <button
                                type="button"
                                onClick={() => {
                                  form.setValue('flopCards', [{ id: 0 }, { id: 1 }, { id: 2 }]);
                                  form.setValue('turnCards', [{ id: 0 }]);
                                  form.setValue('riverCards', [{ id: 0 }]);
                                }}
                                className="text-gray-500 hover:text-gray-800 ml-2"
                                aria-label="Clear all board cards"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {/* Flop Cards */}
                              {flopCards?.filter(c => c.rank && c.suit).map((card, index) => (
                                <div key={`flop-${index}`} className="w-12 h-16 relative">
                                  <div className="w-full h-full bg-white border border-gray-200 rounded flex flex-col items-center justify-between p-1">
                                    <div className="font-bold text-sm">{card.rank}</div>
                                    <div className={`${card.suit === 'h' || card.suit === 'd' ? 'text-red-600' : 'text-black'} text-lg`}>
                                      {card.suit === 'h' ? '♥' : card.suit === 'd' ? '♦' : card.suit === 's' ? '♠' : '♣'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Turn Card */}
                              {turnCards?.filter(c => c.rank && c.suit).map((card, index) => (
                                <div key={`turn-${index}`} className="w-12 h-16 relative">
                                  <div className="w-full h-full bg-white border border-gray-200 rounded flex flex-col items-center justify-between p-1">
                                    <div className="font-bold text-sm">{card.rank}</div>
                                    <div className={`${card.suit === 'h' || card.suit === 'd' ? 'text-red-600' : 'text-black'} text-lg`}>
                                      {card.suit === 'h' ? '♥' : card.suit === 'd' ? '♦' : card.suit === 's' ? '♠' : '♣'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* River Card */}
                              {riverCards?.filter(c => c.rank && c.suit).map((card, index) => (
                                <div key={`river-${index}`} className="w-12 h-16 relative">
                                  <div className="w-full h-full bg-white border border-gray-200 rounded flex flex-col items-center justify-between p-1">
                                    <div className="font-bold text-sm">{card.rank}</div>
                                    <div className={`${card.suit === 'h' || card.suit === 'd' ? 'text-red-600' : 'text-black'} text-lg`}>
                                      {card.suit === 'h' ? '♥' : card.suit === 'd' ? '♦' : card.suit === 's' ? '♠' : '♣'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Show placeholder cards for remaining slots if no cards entered */}
                              {(!flopCards?.some(c => c.rank && c.suit) && !turnCards?.some(c => c.rank && c.suit) && !riverCards?.some(c => c.rank && c.suit)) && (
                                <>
                                  {Array.from({ length: 5 }, (_, index) => (
                                    <div key={`placeholder-${index}`} className="w-12 h-16">
                                      <div className="w-full h-full bg-yellow-400 rounded border-2 border-white relative overflow-hidden">
                                        <div 
                                          className="absolute inset-0 opacity-30"
                                          style={{
                                            backgroundImage: `
                                              repeating-linear-gradient(
                                                45deg,
                                                transparent,
                                                transparent 3px,
                                                white 3px,
                                                white 6px
                                              ),
                                              repeating-linear-gradient(
                                                -45deg,
                                                transparent,
                                                transparent 3px,
                                                white 3px,
                                                white 6px
                                              )
                                            `
                                          }}
                                        >
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="villainCards"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Villain Hand</FormLabel>
                                <FormControl>
                                  <CardSlotPicker
                                    slots={gameType === 'NLH' ? 2 : 4}
                                    selectedCards={field.value || (gameType === 'NLH' ? [{ id: 0 }, { id: 1 }] : [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }])}
                                    onChange={field.onChange}
                                    excludedCards={[
                                      ...(selectedCards.match(/.{2}/g) || []),
                                      ...((flopCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                                      ...((turnCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || []),
                                      ...((riverCards?.filter(c => c.rank && c.suit).map(c => c.rank + c.suit)) || [])
                                    ]}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="result"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Result</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </HandDetailGate>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional details or thoughts about the hand..."
                          className="h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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

      {/* Help Modal */}
      <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Street-by-Street Help</DialogTitle>
            <DialogDescription>
              Guide to using the Street-by-Street analysis section
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Preflop Action</h4>
              <p className="text-sm text-muted-foreground">
                Select the action you took preflop (Open/Flat, 3Bet, 4Bet, BvB).
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Cards (Flop/Turn/River)</h4>
              <p className="text-sm text-muted-foreground">
                Tap blank cards to select rank + suit. Cards already used cannot be reused.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Action fields</h4>
              <p className="text-sm text-muted-foreground">
                Write the betting sequence for that street (e.g., Check, Bet, Call).
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Villain Hand</h4>
              <p className="text-sm text-muted-foreground">
                Enter opponent's cards if showdown occurred.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Result</h4>
              <p className="text-sm text-muted-foreground">
                Short text about the outcome (Won, Lost, Split).
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Board preview</h4>
              <p className="text-sm text-muted-foreground">
                Shows flop/turn/river cards automatically if entered.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default HandForm;
