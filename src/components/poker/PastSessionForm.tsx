import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/Lucide';
import { useSessionContext } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDefaultCurrency, CURRENCIES } from '@/hooks/useDefaultCurrency';
import { PokerSession, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import PastTableCard from './PastTableCard';

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
  location: z.string().min(1, 'Location is required'),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.date({
    required_error: "End date is required",
  }),
  endTime: z.string().min(1, 'End time is required'),
  buyIn: z.string().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'ILS', 'BRL', 'CNY', 'THB', 'INR']),
  payout: z.string().optional(),
  notes: z.string().optional(),
  isOnline: z.boolean().default(false),
  tournamentType: z.string().optional(),
  isMultiDay: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface PastSessionFormProps {
  onClose: () => void;
}

const PastSessionForm: React.FC<PastSessionFormProps> = ({ onClose }) => {
  const { addSession } = useSessionContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const { defaultCurrency, getCurrencySymbol } = useDefaultCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tables, setTables] = useState<TableData[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameType: 'NLH',
      format: 'Cash',
      location: '',
      startTime: '19:00',
      endTime: '21:30',
      buyIn: '',
      currency: (defaultCurrency && ['USD', 'EUR', 'GBP', 'ILS', 'BRL', 'CNY', 'THB', 'INR'].includes(defaultCurrency)) ? defaultCurrency as 'USD' | 'EUR' | 'GBP' | 'ILS' | 'BRL' | 'CNY' | 'THB' | 'INR' : 'USD', // Use user's default currency
      payout: '',
      notes: '',
      isOnline: false,
      tournamentType: undefined,
      isMultiDay: false,
    }
  });

  // Update form currency when default currency changes
  useEffect(() => {
    if (defaultCurrency && ['USD', 'EUR', 'GBP', 'ILS', 'BRL', 'CNY', 'THB', 'INR'].includes(defaultCurrency)) {
      form.setValue('currency', defaultCurrency as 'USD' | 'EUR' | 'GBP' | 'ILS' | 'BRL' | 'CNY' | 'THB' | 'INR');
    }
  }, [defaultCurrency, form]);

  const addTable = () => {
    const values = form.getValues();
    const buyInAmount = parseFloat(values.buyIn || '') || 0;
    const payoutAmount = parseFloat(values.payout || '') || 0;

    if ((!values.buyIn || !values.payout) || (buyInAmount === 0 && payoutAmount === 0)) {
      toast({
        title: 'Missing Information',
        description: 'Please enter buy-in and payout amounts before adding a table.',
        variant: 'destructive',
      });
      return;
    }

    const newTable: TableData = {
      id: uuidv4(),
      name: `Table ${tables.length + 1}`,
      gameType: values.gameType,
      format: values.format,
      location: values.location,
      buyIn: buyInAmount,
      initialBuyIn: buyInAmount,
      cashOut: payoutAmount,
      smallBlind: values.format === 'Cash' ? 1 : 0,
      bigBlind: values.format === 'Cash' ? 2 : 0,
      startTime: new Date(),
      endTime: new Date(),
      isActive: false,
      isOnline: values.isOnline,
      rebuys: 0,
      notes: '',
      hands: [],
      ...(values.format === 'Tournament' && {
        tournamentTypes: values.tournamentType ? [values.tournamentType] : undefined,
        isMultiDay: values.isMultiDay,
      }),
    };

    setTables([...tables, newTable]);
    
    // Clear the input fields
    form.setValue('buyIn', '');
    form.setValue('payout', '');
    
    toast({
      title: 'Table Added',
      description: `Table ${tables.length + 1} has been added to the session.`,
    });
  };

  const updateTable = (tableId: string, updatedTable: TableData) => {
    setTables(tables.map(table => table.id === tableId ? updatedTable : table));
  };

  const deleteTable = (tableId: string) => {
    setTables(tables.filter(table => table.id !== tableId));
  };

  const onSubmit = async (values: FormValues) => {
    if (tables.length === 0) {
      toast({
        title: 'No Tables Added',
        description: 'Please add at least one table before saving the session.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📝 Past session form submitted with values:', values);
      
      // Create start datetime
      const [startHours, startMinutes] = values.startTime.split(':').map(Number);
      const startDateTime = new Date(values.startDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      // Create end datetime
      const [endHours, endMinutes] = values.endTime.split(':').map(Number);
      const endDateTime = new Date(values.endDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      // Calculate duration in minutes
      const sessionDurationInMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
      
      // Calculate totals from all tables
      const totalBuyIn = tables.reduce((sum, table) => sum + table.buyIn, 0);
      const totalCashOut = tables.reduce((sum, table) => sum + (table.cashOut || 0), 0);
      
      const newSession: PokerSession = {
        id: uuidv4(),
        gameType: values.gameType,
        format: values.format,
        location: values.location,
        buyIn: totalBuyIn,
        initialBuyIn: totalBuyIn,
        cashOut: totalCashOut,
        smallBlind: values.format === 'Cash' ? 1 : 0,
        bigBlind: values.format === 'Cash' ? 2 : 0,
        startTime: startDateTime,
        endTime: endDateTime,
        isActive: false,
        isOnline: values.isOnline,
        notes: values.notes,
        sessionDuration: sessionDurationInMinutes,
        currentStatus: 'ended',
        status: 'completed',
        tablesPlayed: tables.length,
        hands: [],
        tables: tables,
        ...(values.format === 'Tournament' && {
          tournamentTypes: values.tournamentType ? [values.tournamentType] : undefined,
          isMultiDay: values.isMultiDay,
        }),
      };

      console.log('🎯 Creating past session:', newSession);

      // Add to local state first
      addSession(newSession);
      
      // Then sync to Supabase if user is logged in
      if (user) {
        console.log('🔄 Syncing past session to Supabase for user:', user.id);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            id: newSession.id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            game_type: values.gameType,
            format: values.format,
            location: values.location,
            buy_in: totalBuyIn,
            initial_buy_in: totalBuyIn,
            cash_out: totalCashOut,
            small_blind: newSession.smallBlind,
            big_blind: newSession.bigBlind,
            is_online: values.isOnline,
            notes: values.notes || null,
            session_duration: sessionDurationInMinutes,
            is_active: false,
            status: 'completed',
            current_status: 'ended',
            tables_played: tables.length,
            tournament_types: newSession.tournamentTypes || null,
            start_time_utc: startDateTime.getTime(),
          })
          .select()
          .single();

        if (sessionError) {
          console.error('❌ Error syncing past session:', sessionError);
          toast({
            title: 'Cloud Sync Warning',
            description: 'Session saved locally but failed to sync to cloud. You can try again later.',
            variant: 'destructive'
          });
        } else if (sessionData) {
          console.log('✅ Past session synced with ID:', sessionData.id);
          
          // Sync tables to database
          if (tables.length > 0) {
            const tablesData = tables.map(table => ({
              id: table.id,
              session_id: sessionData.id,
              table_name: table.name,
              game_format: table.format,
              buy_in: table.buyIn,
              starting_stack: table.startingBB,
              current_stack: table.currentStack,
              rebuys: table.rebuys || 0,
              bounty_amount: table.bountyAmount || 0,
              players_eliminated: table.bountyCount || 0,
              final_position: table.finalPosition,
              cashout: table.cashOut || 0,
              start_time: startDateTime.toISOString(),
              end_time: endDateTime.toISOString(),
              is_active: false,
              table_notes: table.notes,
              table_type: table.gameType,
              stakes: `${table.smallBlind}/${table.bigBlind}`,
            }));

            const { error: tablesError } = await supabase
              .from('session_tables')
              .insert(tablesData);

            if (tablesError) {
              console.error('❌ Error syncing tables:', tablesError);
            }
          }
          
          toast({
            title: 'Past Session Added',
            description: 'Your past session has been successfully recorded and synced to the cloud.',
          });
        }
      } else {
        toast({
          title: 'Past Session Added',
          description: 'Your past session has been successfully recorded locally.',
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving past session:', error);
      toast({
        title: 'Error',
        description: 'There was a problem saving your session.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedFormat = form.watch('format');

  return (
    <div className="w-full max-w-full max-h-[90vh] flex flex-col overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add Past Session</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <Icon name="X" className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Enter details for a completed poker session</p>
        </div>

        <div className="px-4 sm:px-6 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Game Type */}
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
                          <RadioGroupItem value="NLH" id="nlh" className="sr-only peer" />
                        </FormControl>
                        <label 
                          htmlFor="nlh" 
                          className={`flex-1 cursor-pointer py-2 px-3 rounded-md border text-center text-sm ${
                            field.value === 'NLH' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          No Limit Hold'em
                        </label>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="PLO" id="plo" className="sr-only peer" />
                        </FormControl>
                        <label 
                          htmlFor="plo" 
                          className={`flex-1 cursor-pointer py-2 px-3 rounded-md border text-center text-sm ${
                            field.value === 'PLO' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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

            {/* Format */}
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
                          <RadioGroupItem value="Cash" id="cash" className="sr-only peer" />
                        </FormControl>
                        <label 
                          htmlFor="cash" 
                          className={`flex-1 cursor-pointer py-2 px-3 rounded-md border text-center text-sm ${
                            field.value === 'Cash' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Cash Game
                        </label>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Tournament" id="tournament" className="sr-only peer" />
                        </FormControl>
                        <label 
                          htmlFor="tournament" 
                          className={`flex-1 cursor-pointer py-2 px-3 rounded-md border text-center text-sm ${
                            field.value === 'Tournament' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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

            {/* Table Management Section - Moved up after Format */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Table Management</h3>
                <div className="text-sm text-gray-500">
                  {tables.length} table{tables.length !== 1 ? 's' : ''} added
                </div>
              </div>

              {/* Currency and Tournament Type and Buy-in */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="USD" />
                          </SelectTrigger>
                        </FormControl>
                         <SelectContent>
                           {CURRENCIES.map((currency) => (
                             <SelectItem key={currency.code} value={currency.code}>
                               {currency.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tournament Type */}
                {watchedFormat === 'Tournament' && (
                  <FormField
                    control={form.control}
                    name="tournamentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tournament Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tournament type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TOURNAMENT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="col-span-1 sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="buyIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buy-in Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="100.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Payout */}
              <FormField
                control={form.control}
                name="payout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payout Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Add Table Button */}
              <Button 
                type="button" 
                onClick={addTable}
                variant="outline"
                className="w-full"
              >
                <Icon name="Plus" className="h-4 w-4 mr-2" />
                Add Table
              </Button>

              {/* Tables List */}
              {tables.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto overflow-x-hidden w-full">
                  <h4 className="text-sm font-medium text-gray-700">Added Tables:</h4>
                  {tables.map((table) => (
                    <PastTableCard
                      key={table.id}
                      table={table}
                      onUpdate={(updatedTable) => updateTable(table.id, updatedTable)}
                      onDelete={() => deleteTable(table.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Location - Moved after tables list */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Casino name or site name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* End Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any notes about the session..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Online checkbox - Moved to bottom */}
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
                    <FormLabel>Online Session</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check this if this was an online poker session
                    </p>
                  </div>
                </FormItem>
              )}
            />

              {/* Submit buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="default"
                  disabled={isSubmitting}
                  className="flex-1 bg-poker-feltGreen hover:bg-poker-feltGreen/90"
                >
                  {isSubmitting ? 'Saving...' : 'Save Session'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    );
};

export default PastSessionForm;