
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { PokerSession } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/Lucide';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTutorial } from '@/context/TutorialContext';

const TOURNAMENT_TYPES = [
  'Freezeout',
  'Re-Buy Tournament',
  'Bounty',
  'Progressive Bounty (PKO)',
  'Mystery Bounty',
  'Turbo / Hyper',
  'Satellite'
];

const formSchema = z.object({
  gameType: z.enum(['NLH', 'PLO']),
  format: z.enum(['Cash', 'Tournament']),
  location: z.string().min(1, "Location is required"),
  physicalLocation: z.string().optional(),
  buyIn: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Buy-in amount must be a valid number",
  }),
  isOnline: z.boolean().default(false),
  startingBB: z.string().optional(),
  tournamentType: z.string().optional(),
  isMultiDay: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

export default function SessionForm() {
  const navigate = useNavigate();
  const { startSession } = useSessionContext();
  const { completeCurrentStepAction, currentStep } = useTutorial();
  
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
      isMultiDay: false
    }
  });
  
  // Handle tutorial interactions for the game type selection
  const handleGameTypeChange = (value: 'NLH' | 'PLO') => {
    form.setValue('gameType', value);
    
    // Only mark the action as completed if this is the current tutorial step target
    if (currentStep.targetId === 'nlh' && value === 'NLH') {
      console.log("Game type selection is the current tutorial target - marking action as completed");
      completeCurrentStepAction();
    }
  };
  
  const onSubmit = (values: FormValues) => {
    const buyInAmount = parseFloat(values.buyIn);

    const initialTable = {
      id: uuidv4(),
      gameType: values.gameType,
      format: values.format,
      location: values.location,
      buyIn: buyInAmount,
      initialBuyIn: buyInAmount,
      isActive: true,
      startTime: new Date(),
      smallBlind: 0,
      bigBlind: 0,
      ...(values.format === 'Tournament' && {
        startingBB: values.startingBB ? parseInt(values.startingBB) : undefined,
        tournamentTypes: values.tournamentType ? [values.tournamentType] : undefined,
        isMultiDay: values.isMultiDay
      })
    };

    const newSession: PokerSession = {
      id: uuidv4(),
      gameType: values.gameType,
      format: values.format,
      location: values.location,
      physicalLocation: values.isOnline ? values.physicalLocation : undefined,
      buyIn: buyInAmount,
      initialBuyIn: buyInAmount,
      smallBlind: 0,
      bigBlind: 0,
      startTime: new Date(),
      isActive: true,
      isOnline: values.isOnline,
      // Add the missing properties
      currentStatus: 'running',
      sessionDuration: 0,
      ...(values.format === 'Tournament' && {
        startingBB: values.startingBB ? parseInt(values.startingBB) : undefined,
        tournamentTypes: values.tournamentType ? [values.tournamentType] : undefined
      }),
      tables: [initialTable],
    };
    
    startSession(newSession);
    navigate(`/live-session/${newSession.id}`);
  };

  const format = form.watch('format');
  const isOnline = form.watch('isOnline');
  
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
          <p className="text-gray-500 text-sm mt-1">Track your poker performance</p>
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
                      onValueChange={(value) => handleGameTypeChange(value as 'NLH' | 'PLO')}
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
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Multi-Day Tournament</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Toggle this for tournaments that span multiple days
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
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Location</FormLabel>
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
            
            {isOnline && (
              <FormField
                control={form.control}
                name="physicalLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Played from (location):</FormLabel>
                    <FormControl>
                      <Input 
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
              className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md shadow-md transition-all"
            >
              Start Session
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
