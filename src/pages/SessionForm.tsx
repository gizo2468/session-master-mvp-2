
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
import { CurrencySelector } from '@/components/ui/CurrencySelector';
import Icon from '@/components/ui/Lucide';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { PokerSession, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { TOUR_PATHS } from '@/components/onboarding/tourSteps';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

const TOURNAMENT_TYPES = [
  'Freezeout',
  'Re-Buy Tournament',
  'Bounty',
  'Progressive Bounty (PKO)',
  'Mystery Bounty',
  'Turbo / Hyper',
  'Satellite'
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'USD ($)' },
  { code: 'EUR', symbol: '€', name: 'EUR (€)' },
  { code: 'GBP', symbol: '£', name: 'GBP (£)' },
  { code: 'CAD', symbol: '$', name: 'CAD ($)' },
  { code: 'ILS', symbol: '₪', name: 'ILS (₪)' },
  { code: 'BRL', symbol: 'R$', name: 'BRL (R$)' },
  { code: 'CNY', symbol: '¥', name: 'CNY (¥)' },
  { code: 'THB', symbol: '฿', name: 'THB (฿)' },
  { code: 'INR', symbol: '₹', name: 'INR (₹)' },
];

const BLIND_PRESETS = {
  smallBlind: [0.25, 0.5, 1, 2, 3, 5, 10, 25, 50, 100, 200, 500],
  bigBlind: [0.5, 1, 2, 5, 10, 25, 50, 100, 200, 500, 1000]
};

const formSchema = z.object({
  gameType: z.enum(['NLH', 'PLO']),
  format: z.enum(['Cash', 'Tournament']),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'ILS', 'BRL', 'CNY', 'THB', 'INR']),
  location: z.string().optional(),
  physicalLocation: z.string().optional(),
  festivalName: z.string().optional(),
  firstTableName: z.string().optional(),
  buyIn: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Buy-in amount must be a valid number",
  }),
  isOnline: z.boolean().default(false),
  startingBB: z.string().optional(),
  tournamentType: z.string().optional(),
  isMultiDay: z.boolean().default(false),
  lateRegistration: z.boolean().default(false),
  smallBlind: z.number().min(0).optional(),
  bigBlind: z.number().min(0).optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function SessionForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const swipeBackRef = useSwipeBack({ fallbackPath: '/', screenName: 'SessionForm' });
  const { startSession } = useSessionContext();
  const { defaultCurrency, getCurrencySymbol } = useDefaultCurrency();
  const { isPremium } = usePremiumAccess();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    shouldShow: showOnboardingTour,
    currentStep: tourStep,
    activePath: tourPath,
    setStep: setTourStep,
    selectPath: selectTourPath,
    returnToMenu: returnToTourMenu,
    dismiss: dismissOnboardingTour,
  } = useOnboardingTour();
  const tourSteps = tourPath ? TOUR_PATHS[tourPath] : [];
  const isFormTourStep =
    tourPath === 'start-session' && tourSteps[tourStep]?.route === '/new-session';
  const [smallBlindIndex, setSmallBlindIndex] = useState(2); // Default to $1
  const [smallBlind, setSmallBlind] = useState(BLIND_PRESETS.smallBlind[2]);
  const [bigBlind, setBigBlind] = useState(BLIND_PRESETS.smallBlind[2] * 2);
  const [isTournamentTypeOpen, setIsTournamentTypeOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Onboarding: auto-open Advanced Options when the tour requests it.
  useEffect(() => {
    const handler = () => setIsAdvancedOpen(true);
    window.addEventListener('onboarding:open-advanced', handler);
    return () => window.removeEventListener('onboarding:open-advanced', handler);
  }, []);
  
  // Premium manual blinds state
  const [isManualBlindsOpen, setIsManualBlindsOpen] = useState(false);
  const [tempManualSB, setTempManualSB] = useState<string>('');
  const [tempManualBB, setTempManualBB] = useState<string>('');
  const [manualBlindsError, setManualBlindsError] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameType: 'NLH',
      format: 'Cash',
      currency: (defaultCurrency && ['USD', 'EUR', 'GBP', 'CAD', 'ILS', 'BRL', 'CNY', 'THB', 'INR'].includes(defaultCurrency)) ? defaultCurrency as 'USD' | 'EUR' | 'GBP' | 'CAD' | 'ILS' | 'BRL' | 'CNY' | 'THB' | 'INR' : 'USD',
      location: '',
      physicalLocation: '',
      festivalName: '',
      firstTableName: '',
      buyIn: '',
      isOnline: false,
      startingBB: '',
      tournamentType: undefined,
      isMultiDay: false,
      lateRegistration: false,
      smallBlind: BLIND_PRESETS.smallBlind[2],
      bigBlind: BLIND_PRESETS.smallBlind[2] * 2
    }
  });

  // Update form currency when default currency changes
  useEffect(() => {
    if (defaultCurrency && ['USD', 'EUR', 'GBP', 'CAD', 'ILS', 'BRL', 'CNY', 'THB', 'INR'].includes(defaultCurrency)) {
      form.setValue('currency', defaultCurrency as 'USD' | 'EUR' | 'GBP' | 'CAD' | 'ILS' | 'BRL' | 'CNY' | 'THB' | 'INR');
    }
  }, [defaultCurrency, form]);

  // Update big blind whenever small blind changes for cash games (only in auto mode)
  useEffect(() => {
    if (form.watch('format') === 'Cash' && !isManualMode) {
      setBigBlind(smallBlind * 2);
      form.setValue('bigBlind', smallBlind * 2);
    }
  }, [smallBlind, form, isManualMode]);
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log('📝 Form submitted with values:', values);
      
      const buyInAmount = parseFloat(values.buyIn);
      
      if (isNaN(buyInAmount) || buyInAmount < 0) {
        throw new Error('Invalid buy-in amount');
      }

      const monthDay = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const sessionLabel = values.location?.trim() || `Session ${monthDay}`;
      const tableLabel = values.firstTableName?.trim() || 'Table 1';

      // Create the initial table object from form data
      const initialTable: TableData = {
        id: uuidv4(),
        name: tableLabel,
        format: values.format as 'Cash' | 'Tournament',
        gameType: values.gameType,
        location: tableLabel,
        buyIn: buyInAmount,
        initialBuyIn: buyInAmount,
        startTime: new Date(),
        isActive: true,
        isOnline: values.isOnline,
        rebuys: 0,
        addOns: 0,
        ...(values.format === 'Cash' && {
          smallBlind: values.smallBlind || smallBlind,
          bigBlind: values.bigBlind || bigBlind,
        }),
        ...(values.format === 'Tournament' && {
          startingBB: values.startingBB ? parseInt(values.startingBB) : undefined,
          tournamentTypes: values.tournamentType ? [values.tournamentType] : undefined,
          isMultiDay: values.isMultiDay,
          lateRegistration: values.lateRegistration,
        }),
      };

      // Create the session object with the initial table
      const newSession: PokerSession = {
        id: uuidv4(),
        gameType: values.gameType,
        format: values.format,
        location: sessionLabel,
        physicalLocation: values.isOnline ? values.physicalLocation : undefined,
        tableName: tableLabel,
        buyIn: buyInAmount,
        initialBuyIn: buyInAmount,
        smallBlind: values.format === 'Cash' ? (values.smallBlind || smallBlind) : 0,
        bigBlind: values.format === 'Cash' ? (values.bigBlind || bigBlind) : 0,
        isOnline: values.isOnline,
        startingBB: values.format === 'Tournament' && values.startingBB ? parseInt(values.startingBB) : undefined,
        tournamentTypes: values.format === 'Tournament' && values.tournamentType ? [values.tournamentType] : undefined,
        isMultiDay: values.isMultiDay,
        festivalName: values.festivalName?.trim() || undefined,
        currency: values.currency || defaultCurrency,
        startTime: new Date(),
        isActive: true,
        currentStatus: 'running',
        sessionDuration: 0,
        hands: [],
        tables: [initialTable] // Add the initial table to the session
      };

      console.log('🎯 Starting session with initial table:', newSession);

      // FIXED: Use SessionContext to start the session and wait for the returned session
      const createdSession = await startSession(newSession);
      const finalSessionId = createdSession.id;

      console.log('✅ Session started successfully with ID:', finalSessionId);

      // Show success message
      toast({
        title: "Session Started",
        description: "Your poker session has been successfully created with the initial table."
      });

      // FIXED: Wait longer and add better verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // FIXED: Verify session was created before navigating with retry mechanism
      let verificationAttempts = 0;
      const maxVerificationAttempts = 5;
      let sessionVerified = false;

      while (verificationAttempts < maxVerificationAttempts && !sessionVerified) {
        try {
          const { data: verifySession } = await supabase
            .from('sessions')
            .select('id, is_active')
            .eq('id', finalSessionId)
            .single();

          if (verifySession && verifySession.is_active) {
            sessionVerified = true;
            console.log('✅ Session verified in database, navigating...');
          } else {
            throw new Error('Session not found or not active');
          }
        } catch (verifyError) {
          verificationAttempts++;
          console.warn(`⚠️ Session verification attempt ${verificationAttempts} failed:`, verifyError);
          
          if (verificationAttempts < maxVerificationAttempts) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      if (!sessionVerified) {
        console.warn('⚠️ Session verification failed after all attempts, but proceeding with navigation');
        toast({
          title: "Warning",
          description: "Session created but verification incomplete. If you encounter issues, please try refreshing.",
          variant: "destructive"
        });
      }

      // Advance the onboarding tour to the Live Session steps (do NOT dismiss).
      if (showOnboardingTour) {
        setTourStep(tourStep + 1);
      }

      // FIXED: Navigate to the live session page with the correct session ID
      console.log('🔄 Navigating to live session page:', `/session/${finalSessionId}`);
      navigate(`/session/${finalSessionId}`, { replace: true });
      
    } catch (error) {
      console.error('❌ Error starting session:', error);
      
      let errorMessage = "There was a problem starting your session. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          errorMessage = "Session ID conflict. Please try again.";
        } else if (error.message.includes('RLS')) {
          errorMessage = "Authentication required. Please log in and try again.";
        } else if (error.message.includes('constraint')) {
          errorMessage = "Invalid session data. Please check your inputs and try again.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = `Session creation failed: ${error.message}`;
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
  const selectedCurrency = form.watch('currency');
  
  // Get current currency symbol
  const getCurrentCurrencySymbol = () => {
    const currency = CURRENCIES.find(c => c.code === selectedCurrency);
    return currency?.symbol || '$';
  };

  const handleSmallBlindChange = (value: number[]) => {
    const index = value[0];
    setSmallBlindIndex(index);
    const newSmallBlind = BLIND_PRESETS.smallBlind[index];
    setSmallBlind(newSmallBlind);
    setIsManualMode(false); // Reset manual mode when slider is used
    
    form.setValue('smallBlind', newSmallBlind);
    // Big blind will be automatically updated by useEffect
  };

  // Premium manual blinds handlers
  const handleOpenManualBlinds = () => {
    setTempManualSB(smallBlind.toString());
    setTempManualBB(bigBlind.toString());
    setManualBlindsError('');
    setIsManualBlindsOpen(true);
  };

  const handleSaveManualBlinds = () => {
    const sb = parseFloat(tempManualSB);
    const bb = parseFloat(tempManualBB);
    
    // Validation: positive numbers only
    if (isNaN(sb) || sb <= 0) {
      setManualBlindsError('Small Blind must be a positive number');
      return;
    }
    if (isNaN(bb) || bb <= 0) {
      setManualBlindsError('Big Blind must be a positive number');
      return;
    }
    // Validation: BB ≥ SB
    if (bb < sb) {
      setManualBlindsError('Big Blind must be ≥ Small Blind');
      return;
    }
    
    // Apply the values
    setSmallBlind(sb);
    setBigBlind(bb);
    form.setValue('smallBlind', sb);
    form.setValue('bigBlind', bb);
    setIsManualMode(true);
    setIsManualBlindsOpen(false);
  };

  const handleCancelManualBlinds = () => {
    setManualBlindsError('');
    setIsManualBlindsOpen(false);
  };
  
  return (
    <div ref={swipeBackRef} className="min-h-screen content-safe">
      <div className="container mx-auto max-w-md px-4 pb-8">
        <header className="mb-8">
          <button 
            type="button"
            data-tour-allow="true"
            onClick={() => {
              const idx = (window.history.state && typeof window.history.state.idx === 'number')
                ? window.history.state.idx
                : null;
              const canGoBack = idx !== null ? idx > 0 : window.history.length > 1;
              if (canGoBack) {
                navigate(-1);
              } else {
                navigate('/', { replace: true });
              }
            }} 
            className="text-poker-gold mb-4 flex items-center gap-1 hover:underline relative z-[101]"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-foreground text-center">Start New Session</h1>
          <p className="text-gray-500 dark:text-muted-foreground text-sm mt-1 text-center">Enter your first table details below</p>
        </header>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off" className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-6 space-y-6">
            <div data-tour="game-setup" className="space-y-6">
            <FormField
              control={form.control}
              name="gameType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-medium">Game Type <span className="text-red-500 text-sm">*</span></FormLabel>
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
                              ? 'bg-poker-gold text-white border-poker-gold' 
                              : 'bg-white dark:bg-card text-gray-700 dark:text-gray-300 border-gray-300 dark:border-border'
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
                              ? 'bg-poker-gold text-white border-poker-gold' 
                              : 'bg-white dark:bg-card text-gray-700 dark:text-gray-300 border-gray-300 dark:border-border'
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
                  <FormLabel className="text-base font-medium">Format <span className="text-red-500 text-sm">*</span></FormLabel>
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
                              ? 'bg-poker-gold text-white border-poker-gold' 
                              : 'bg-white dark:bg-card text-gray-700 dark:text-gray-300 border-gray-300 dark:border-border'
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
                              ? 'bg-poker-gold text-white border-poker-gold' 
                              : 'bg-white dark:bg-card text-gray-700 dark:text-gray-300 border-gray-300 dark:border-border'
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
            </div>

            {format === 'Tournament' && (
              <Collapsible open={isTournamentTypeOpen} onOpenChange={setIsTournamentTypeOpen}>
                <CollapsibleTrigger className="flex items-center justify-center gap-2 w-full py-2">
                  <span className="text-base font-medium text-poker-gold">Tournament Type</span>
                  <ChevronDown className={`h-4 w-4 text-poker-gold transition-transform duration-200 ${isTournamentTypeOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <FormField
                    control={form.control}
                    name="tournamentType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
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
                                      : 'bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-muted'
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
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Currency Dropdown */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Currency <span className="text-red-500 text-sm">*</span></FormLabel>
                  <FormControl>
                    <CurrencySelector 
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select currency"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div data-tour="stakes" className="space-y-6">
            <FormField
              control={form.control}
              name="buyIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Buy-in Amount <span className="text-red-500 text-sm">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                         <span className="text-gray-500 dark:text-muted-foreground">{getCurrentCurrencySymbol()}</span>
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
                        <span className="text-sm font-medium">{getCurrentCurrencySymbol()}{smallBlind}</span>
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
                        <span className="text-sm font-medium">{getCurrentCurrencySymbol()}{bigBlind}</span>
                      </div>
                      {isPremium ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleOpenManualBlinds}
                          className="w-full text-sm text-poker-gold border-poker-gold hover:bg-poker-gold/10"
                        >
                          {isManualMode ? 'Edit Manual Blinds' : 'Enter Manual'}
                        </Button>
                      ) : (
                        <div className="py-2 px-3 bg-gray-100 dark:bg-muted rounded-md border">
                          <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 text-center">
                            Auto-set to 2× Small Blind
                          </div>
                        </div>
                      )}
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
            </div>
            
            {/* Session Name - moved before Advanced Options */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem data-tour="optional-details">
                  <FormLabel className="text-base font-medium">Session Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="" 
                      autoComplete="off"
                      data-form-type="other"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Advanced Options - Collapsible Section */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger className="flex items-center justify-center gap-2 w-full py-3 border-t pt-4">
                <span className="text-base font-medium text-poker-gold">Advanced Options</span>
                <ChevronDown className={`h-4 w-4 text-poker-gold transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div data-tour="advanced-checkboxes" className="space-y-4">
                {/* Online Game */}
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

                {/* Multi-Day Tournament - only for Tournament format */}
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
                            Check this if your first tournament is a multi-day tournament for multiple days
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {/* Late Registration - only for Tournament format */}
                {format === 'Tournament' && (
                  <FormField
                    control={form.control}
                    name="lateRegistration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Late Registration</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable if late registration is available
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
                </div>


                {/* First Table Name - optional override for the initial table */}
                <FormField
                  control={form.control}
                  name="firstTableName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        First Table Name <span className="text-muted-foreground font-normal">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder=""
                          autoComplete="off"
                          data-form-type="other"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Festival Name - optional metadata */}
                <FormField
                  control={form.control}
                  name="festivalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Festival Name <span className="text-muted-foreground font-normal">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., WSOP, EPT, or Winter Series"
                          autoComplete="off"
                          data-form-type="other"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            <Button
              type="submit"
              data-tour="submit-session"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md shadow-md dark:shadow-black/30 transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting Session...
                </div>
              ) : (
                'Start Session'
              )}
            </Button>
          </form>
        </Form>

        {/* Premium Manual Blinds Dialog */}
        <Dialog open={isManualBlindsOpen} onOpenChange={setIsManualBlindsOpen}>
          <DialogContent className="sm:max-w-[320px]">
            <DialogHeader>
              <DialogTitle>Set Manual Blinds</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {manualBlindsError && (
                <p className="text-sm text-red-500">{manualBlindsError}</p>
              )}
              
              {/* Small Blind */}
              <div className="space-y-2">
                <Label htmlFor="manualSmallBlind">Small Blind</Label>
                <Input
                  id="manualSmallBlind"
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 1"
                  value={tempManualSB}
                  onChange={(e) => setTempManualSB(e.target.value)}
                  min="0"
                  step="0.01"
                  autoComplete="off"
                />
              </div>

              {/* Big Blind */}
              <div className="space-y-2">
                <Label htmlFor="manualBigBlind">Big Blind</Label>
                <Input
                  id="manualBigBlind"
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 2"
                  value={tempManualBB}
                  onChange={(e) => setTempManualBB(e.target.value)}
                  min="0"
                  step="0.01"
                  autoComplete="off"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancelManualBlinds}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSaveManualBlinds}
                className="bg-poker-gold hover:bg-poker-darkGold text-white"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Onboarding tour continuation on the New Session screen */}
      {showOnboardingTour && isFormTourStep && (
        <OnboardingTour
          steps={tourSteps}
          currentStep={tourStep}
          onStepChange={setTourStep}
          onClose={dismissOnboardingTour}
          activePath={tourPath}
          onSelectPath={selectTourPath}
          onReturnToMenu={returnToTourMenu}
        />
      )}
    </div>
  );
}
