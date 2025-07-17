import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import CardSelector from './CardSelector';
import { HandData } from '@/types/poker';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/Lucide';
import { PokerChip } from '../Icons';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { CircleHelp, Camera } from 'lucide-react';

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
  currencyType: z.enum(['currency', 'chips']).default('currency'),
  resultAmount: z.number().optional(),
  smallBlind: z.number().optional(),
  bigBlind: z.number().optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  pokercraftLink: z.string().url('Invalid URL format').optional().or(z.literal('')),
  image: z.string().optional().or(z.any().optional()),
  gameType: z.enum(['NLH', 'PLO']).default('NLH'),
  tableId: z.string().optional(),
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
      currencyType: tableFormat 
        ? (tableFormat === 'Cash' ? 'currency' : 'chips') 
        : (initialData.currencyType || 'currency'),
      resultAmount: initialData.resultAmount || undefined,
      smallBlind: initialData.smallBlind || undefined,
      bigBlind: initialData.bigBlind || undefined,
      notes: initialData.notes || '',
      pokercraftLink: initialData.pokercraftLink || '',
      image: initialData.image || undefined,
      gameType: initialData.gameType || 'NLH',
      tableId: tableId || initialData.tableId,
    }
  });
  
  // Position selector state - simplified approach now
  const [selectedPositionIndex, setSelectedPositionIndex] = useState(0);
  
  // Get current form values for reactive UI updates
  const gameType = form.watch('gameType');
  const selectedCards = form.watch('cards');
  const currencyType = tableFormat 
    ? (tableFormat === 'Cash' ? 'currency' : 'chips')
    : form.watch('currencyType');
  
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
  
  // Set currencyType based on tableFormat when it changes
  useEffect(() => {
    if (tableFormat) {
      form.setValue('currencyType', tableFormat === 'Cash' ? 'currency' : 'chips');
    }
  }, [tableFormat, form]);
  
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
        currencyType: tableFormat === 'Cash' ? 'currency' : 'chips',
        resultAmount: undefined,
        smallBlind: undefined,
        bigBlind: undefined,
        notes: '',
        pokercraftLink: '',
        image: undefined,
        gameType: 'NLH',
        tableId: tableId,
      });
      setImagePreview(null);
      setSelectedPositionIndex(0);
    }
  }, [open, isEditing, form, tableId, tableFormat]);
  
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
    
    onSubmit({
      ...values,
      id: initialData.id,
      image: imagePreview,
      position: positions[selectedPositionIndex] // Use the position from our wheel picker
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
    action: "The type of betting action you took with this hand. Open/Flat means opening the pot or calling. 3Bet means raising a previous raise.",
    resultAmount: "Enter how much you won or lost on this hand. For cash games, use currency. For tournaments, use chip value.",
    blinds: "The stakes being played. Small blind is typically half of the big blind. These values establish the relative value of bets."
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Hand' : 'Add New Hand'}</DialogTitle>
          <DialogDescription>
            Record the details of your poker hand for analysis and tracking.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="p-1">
            <Form {...form}>
              <form onSubmit={(e) => {
                if (e.nativeEvent instanceof KeyboardEvent && e.nativeEvent.key === 'Enter') {
                  e.preventDefault();
                  return false;
                }
                
                form.handleSubmit(handleSubmit)(e);
              }} className="space-y-6">
                
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
                
                <FormField
                  control={form.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Action</FormLabel>
                        <AdaptiveTooltip content={tooltipContent.action}>
                          <CircleHelp className="h-4 w-4 text-gray-500" />
                        </AdaptiveTooltip>
                      </div>
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
                
                <div className="space-y-4">
                  {/* Hide currency type selector if table format is provided */}
                  {!tableFormat && (
                    <FormField
                      control={form.control}
                      name="currencyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Type</FormLabel>
                          <FormControl>
                            <ToggleGroup 
                              type="single" 
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex justify-center gap-4 my-1"
                            >
                              <ToggleGroupItem 
                                value="currency" 
                                variant="outline"
                                className={`flex-1 py-2 ${field.value === 'currency' ? 
                                  'bg-poker-feltGreen text-white' : 
                                  'bg-white'}`}
                              >
                                💵 Currency
                              </ToggleGroupItem>
                              <ToggleGroupItem 
                                value="chips" 
                                variant="outline"
                                className={`flex-1 py-2 ${field.value === 'chips' ? 
                                  'bg-poker-feltGreen text-white' : 
                                  'bg-white'}`}
                              >
                                <PokerChip className="h-5 w-5" /> Chips
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                
                  <FormField
                    control={form.control}
                    name="resultAmount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Result Amount</FormLabel>
                          <AdaptiveTooltip content={tooltipContent.resultAmount}>
                            <CircleHelp className="h-4 w-4 text-gray-500" />
                          </AdaptiveTooltip>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              {currencyType === 'currency' ? (
                                <span className="text-gray-500">$</span>
                              ) : (
                                <span className="text-gray-500"><PokerChip className="h-5 w-5" /></span>
                              )}
                            </div>
                            <Input 
                              type="number"
                              placeholder="0.00"
                              className="pl-8"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value !== undefined ? field.value : ''}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {currencyType === 'currency' ? 
                            'Positive for wins, negative for losses' : 
                            'Tournament chip value won or lost'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="smallBlind"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Small Blind</FormLabel>
                          <AdaptiveTooltip content={tooltipContent.blinds}>
                            <CircleHelp className="h-4 w-4 text-gray-500" />
                          </AdaptiveTooltip>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500">
                                {currencyType === 'currency' ? '💵' : <PokerChip className="h-5 w-5" />}
                              </span>
                            </div>
                            <Input 
                              type="number"
                              placeholder="Small Blind"
                              className="pl-8"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value !== undefined ? field.value : ''}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {currencyType === 'currency' ? 'Cash game small blind' : 'Tournament small blind'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    
                  <FormField
                    control={form.control}
                    name="bigBlind"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Big Blind</FormLabel>
                          <AdaptiveTooltip content={tooltipContent.blinds}>
                            <CircleHelp className="h-4 w-4 text-gray-500" />
                          </AdaptiveTooltip>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500">
                                {currencyType === 'currency' ? '💵' : <PokerChip className="h-5 w-5" />}
                              </span>
                            </div>
                            <Input 
                              type="number"
                              placeholder="Big Blind"
                              className="pl-8"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value !== undefined ? field.value : ''}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {currencyType === 'currency' ? 'Cash game big blind' : 'Tournament big blind'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
          </div>
        </ScrollArea>
        
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
      </DialogContent>
    </Dialog>
  );
};

export default HandForm;
