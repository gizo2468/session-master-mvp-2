import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/Lucide';
import { Slider } from '@/components/ui/slider';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { PokerSession } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';

const TOURNAMENT_TYPES = [
  'Freezeout',
  'Re-Buy Tournament',
  'Bounty',
  'Progressive Bounty (PKO)',
  'Mystery Bounty',
  'Turbo / Hyper',
  'Satellite'
];

const BLIND_PRESETS = {
  smallBlind: [0.25, 0.5, 1, 2, 3, 5, 10, 25, 50, 100, 200, 500],
  bigBlind: [0.5, 1, 2, 5, 10, 25, 50, 100, 200, 500, 1000]
};

const formSchema = z.object({
  gameType: z.enum(['NLH', 'PLO']),
  format: z.enum(['Cash', 'Tournament']),
  location: z.string().min(1, "Table name is required"),
  physicalLocation: z.string().optional(),
  buyIn: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Buy-in amount must be a valid number",
  }),
  isOnline: z.boolean().default(false),
  startingBB: z.string().optional(),
  tournamentType: z.string().optional(),
  isMultiDay: z.boolean().default(false),
  smallBlind: z.number().min(0).optional(),
  bigBlind: z.number().min(0).optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function SessionForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startSession } = useSessionContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smallBlindIndex, setSmallBlindIndex] = useState(2); // Default to $1
  const [smallBlind, setSmallBlind] = useState(BLIND_PRESETS.smallBlind[2]);
  const [bigBlind, setBigBlind] = useState(BLIND_PRESETS.smallBlind[2] * 2);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameType: 'NLH',
      format: 'Cash',
      location: '',
      physicalLocation: '',
      buyIn: '',
      isOnline: false,
      startingBB: '',
      tournamentType: undefined,
      isMultiDay: false,
      smallBlind: BLIND_PRESETS.smallBlind[2],
      bigBlind: BLIND_PRESETS.smallBlind[2] * 2
    }
  });

  // Update big blind whenever small blind changes for cash games
  useEffect(() => {
    if (form.watch('format') === 'Cash') {
      setBigBlind(smallBlind * 2);
      form.setValue('bigBlind', smallBlind * 2);
    }
  }, [smallBlind, form]);
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log('📝 Form submitted with values:', values);
      
      const buyInAmount = parseFloat(values.buyIn);
      
      if (isNaN(buyInAmount) || buyInAmount < 0) {
        throw new Error('Invalid buy-in amount');
      }

      // Create the session object to pass to SessionContext
      const newSession: PokerSession = {
        id: uuidv4(),
        gameType: values.gameType,
        format: values.format,
        location: values.location,
        physicalLocation: values.isOnline ? values.physicalLocation : undefined,
        tableName: values.location,
        buyIn: buyInAmount,
        initialBuyIn: buyInAmount,
        smallBlind: values.format === 'Cash' ? (values.smallBlind || 1) : 0,
        bigBlind: values.format === 'Cash' ? (values.bigBlind || 2) : 0,
        isOnline: values.isOnline,
        startingBB: values.format === 'Tournament' && values.startingBB ? parseInt(values.startingBB) : undefined,
        tournamentTypes: values.format === 'Tournament' && values.tournamentType ? [values.tournamentType] : undefined,
        isMultiDay: values.isMultiDay,
        startTime: new Date(),
        isActive: true,
        currentStatus: 'running',
        sessionDuration: 0,
        hands: [],
        tables: []
      };

      console.log('🎯 Starting session with SessionContext:', newSession);

      // Use SessionContext to start the session - this handles both DB and state
      await startSession(newSession);

      console.log('✅ Session started successfully');

      toast({
        title: "Session Started",
        description: "Your poker session has been successfully created."
      });

      // Navigate to home page where the active session will be displayed
      navigate('/');
      
    } catch (error) {
      console.error('❌ Error starting session:', error);
      
      // Show more specific error message based on error type
      let errorMessage = "There was a problem starting your session. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('RLS')) {
          errorMessage = "Authentication required. Please log in and try again.";
        } else if (error.message.includes('constraint')) {
          errorMessage = "Invalid session data. Please check your inputs and try again.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      toast({
        title: "Error Starting Session",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const format = form.watch('format');
  const isOnline = form.watch('isOnline');

  const handleSmallBlindChange = (value: number[]) => {
    const index = value[0];
    setSmallBlindIndex(index);
    const newSmallBlind = BLIND_PRESETS.smallBlind[index];
    setSmallBlind(newSmallBlind);
    
    form.setValue('smallBlind', newSmallBlind);
    // Big blind will be automatically updated by useEffect
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-poker-black">Start New Session</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your session details below</p>
        </header>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <FormField
              control={form.control}
              name="gameType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-medium">Game Type</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value="NLH" 
                            id="nlh" 
                            className="sr-only peer" 
                          />
                        </FormControl>
                        <label 
                          htmlFor="nlh" 
                          className={`flex-1 cursor-pointer py-3 px-4 rounded-md border text-center ${
                            field.value === 'NLH' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          No Limit Hold'em
                        </label>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value="PLO" 
                            id="plo" 
                            className="sr-only peer" 
                          />
                        </FormControl>
                        <label 
                          htmlFor="plo" 
                          className={`flex-1 cursor-pointer py-3 px-4 rounded-md border text-center ${
                            field.value === 'PLO' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          Pot Limit Omaha
                        </label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            
            
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-medium">Format</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value="Cash" 
                            id="cash" 
                            className="sr-only peer" 
                          />
                        </FormControl>
                        <label 
                          htmlFor="cash" 
                          className={`flex-1 cursor-pointer py-3 px-4 rounded-md border text-center ${
                            field.value === 'Cash' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          Cash Game
                        </label>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value="Tournament" 
                            id="tournament" 
                            className="sr-only peer" 
                          />
                        </FormControl>
                        <label 
                          htmlFor="tournament" 
                          className={`flex-1 cursor-pointer py-3 px-4 rounded-md border text-center ${
                            field.value === 'Tournament' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          Tournament
                        </label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {format === 'Tournament' && (
              <FormField
                control={form.control}
                name="tournamentType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">Tournament Type</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        className="flex flex-wrap gap-2"
                      >
                        {TOURNAMENT_TYPES.map((type) => (
                          <FormItem key={type} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem 
                                value={type}
                                id={type}
                                className="sr-only peer"
                              />
                            </FormControl>
                            <label
                              htmlFor={type}
                              className={`cursor-pointer px-3 py-1 rounded-full text-sm ${
                                field.value === type
                                  ? 'bg-poker-gold text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {type}
                            </label>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {format === 'Tournament' && (
              <FormField
                control={form.control}
                name="isMultiDay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Multi-Day Tournament</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Check this for tournaments that span multiple days
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="isOnline"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Online Game</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check this if you're playing online
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            {isOnline && (
              <FormField
                control={form.control}
                name="physicalLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Physical Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Where are you playing from?"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Table Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Casino name or online site" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="buyIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Buy-in Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-8" 
                        min="0" 
                        step="0.01" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {format === 'Cash' && (
              <div className="space-y-4">
                <div className="flex justify-between mb-1">
                  <FormLabel className="text-base font-medium">Blinds</FormLabel>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Small Blind</FormLabel>
                        <span className="text-sm font-medium">${smallBlind}</span>
                      </div>
                      <FormControl>
                        <Slider
                          value={[smallBlindIndex]}
                          max={BLIND_PRESETS.smallBlind.length - 1}
                          step={1}
                          onValueChange={handleSmallBlindChange}
                          className="py-2"
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                  <div className="space-y-2">
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Big Blind</FormLabel>
                        <span className="text-sm font-medium">${bigBlind}</span>
                      </div>
                      <div className="py-2 px-3 bg-gray-100 rounded-md border">
                        <div className="text-sm text-gray-600 text-center">
                          Auto-set to 2× Small Blind
                        </div>
                      </div>
                    </FormItem>
                  </div>
                </div>
              </div>
            )}
            
            {format === 'Tournament' && (
              <FormField
                control={form.control}
                name="startingBB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Starting BB Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter starting big blinds" 
                        min="0"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md shadow-md transition-all"
            >
              {isSubmitting ? 'Starting Session...' : 'Start Session'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
