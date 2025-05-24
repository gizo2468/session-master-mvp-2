
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TableData } from '@/types/poker';
import PastMultiDayEndDialog from './PastMultiDayEndDialog';

const tableSchema = z.object({
  name: z.string().optional(),
  gameType: z.enum(['NLH', 'PLO']),
  format: z.enum(['Cash', 'Tournament']),
  tournamentTypes: z.array(z.string()).optional(),
  buyIn: z.number().min(0),
  initialBuyIn: z.number().min(0),
  rebuysAmount: z.number().min(0).default(0),
  rebuysCount: z.number().min(0).default(0),
  smallBlind: z.number().optional(),
  bigBlind: z.number().optional(),
  startingBB: z.number().optional(),
  cashOut: z.number().min(0).default(0),
  finalPosition: z.number().optional(),
  bountyCount: z.number().min(0).default(0),
  bountyAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  isOnline: z.boolean().default(false),
  isMultiDay: z.boolean().default(false),
});

type TableFormData = z.infer<typeof tableSchema>;

interface PastAddTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => void;
  sessionLocation: string;
}

const PastAddTableForm: React.FC<PastAddTableFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  sessionLocation
}) => {
  const [showMultiDayDialog, setShowMultiDayDialog] = useState(false);
  const [pendingTableData, setPendingTableData] = useState<TableFormData | null>(null);

  const form = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      gameType: 'NLH',
      format: 'Cash',
      buyIn: 0,
      initialBuyIn: 0,
      rebuysAmount: 0,
      rebuysCount: 0,
      cashOut: 0,
      bountyCount: 0,
      bountyAmount: 0,
      isOnline: false,
      isMultiDay: false,
    },
  });

  const watchedFormat = form.watch('format');
  const watchedInitialBuyIn = form.watch('initialBuyIn');
  const watchedRebuysAmount = form.watch('rebuysAmount');
  const watchedRebuysCount = form.watch('rebuysCount');
  const watchedCashOut = form.watch('cashOut');
  const watchedBountyAmount = form.watch('bountyAmount');
  const watchedIsMultiDay = form.watch('isMultiDay');

  // Calculate rebuys value based on format
  const rebuysValue = watchedFormat === 'Cash' 
    ? watchedRebuysAmount 
    : watchedRebuysCount * watchedInitialBuyIn;
  
  // Calculate total buy-in (initial + rebuys value)
  const totalBuyIn = watchedInitialBuyIn + rebuysValue;

  // Calculate profit/loss: (Cash Out + Bounty Amount) - Total Buy-in
  const profitLoss = (watchedCashOut + (watchedFormat === 'Tournament' ? watchedBountyAmount : 0)) - totalBuyIn;

  const handleSubmit = (data: TableFormData) => {
    console.log('=== FORM SUBMISSION START ===');
    console.log('Form submitted with data:', data);
    console.log('Is Multi Day:', data.isMultiDay);
    console.log('Format:', data.format);
    
    // Check if this is a multi-day tournament
    if (data.format === 'Tournament' && data.isMultiDay) {
      console.log('✅ Multi-day tournament detected! Showing dialog...');
      setPendingTableData(data);
      setShowMultiDayDialog(true);
      return;
    }
    
    console.log('Regular table submission (not multi-day)');
    // Regular table completion
    submitTable(data);
  };

  const submitTable = (
    data: TableFormData,
    isEliminated: boolean = true,
    cashOut?: number,
    notes?: string,
    bountyInfo?: {
      bountyCount?: number,
      bountyAmount?: number,
      finalPosition?: number
    },
    multiDayInfo?: {
      nextDayStart?: Date,
      chipsCarryover?: number,
      dayEndedWithoutElimination?: boolean
    }
  ) => {
    console.log('=== SUBMITTING TABLE ===');
    console.log('Data:', data);
    console.log('Multi-day info:', multiDayInfo);
    
    const tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'> = {
      name: data.name,
      gameType: data.gameType,
      format: data.format,
      location: sessionLocation,
      buyIn: totalBuyIn,
      initialBuyIn: data.initialBuyIn,
      cashOut: multiDayInfo?.dayEndedWithoutElimination ? 0 : (cashOut ?? data.cashOut),
      smallBlind: data.smallBlind,
      bigBlind: data.bigBlind,
      endTime: new Date(),
      rebuys: rebuysValue,
      addOns: 0,
      notes: notes || data.notes,
      finalPosition: bountyInfo?.finalPosition ?? data.finalPosition,
      startingBB: data.startingBB,
      bountyCount: bountyInfo?.bountyCount ?? data.bountyCount,
      bountyAmount: bountyInfo?.bountyAmount ?? data.bountyAmount,
      tournamentTypes: data.tournamentTypes,
      isOnline: data.isOnline,
      isMultiDay: data.isMultiDay,
      ...(multiDayInfo?.nextDayStart && { nextDayStart: multiDayInfo.nextDayStart }),
      ...(multiDayInfo?.chipsCarryover && { chipsCarryover: multiDayInfo.chipsCarryover }),
      ...(multiDayInfo?.dayEndedWithoutElimination && { dayEndedWithoutElimination: true }),
      hands: []
    };
    
    console.log('Calling onSubmit with tableData:', tableData);
    onSubmit(tableData);
    form.reset();
    onOpenChange(false);
  };

  const handleMultiDayComplete = (
    isEliminated: boolean,
    cashOut?: number,
    notes?: string,
    bountyInfo?: {
      bountyCount?: number,
      bountyAmount?: number,
      finalPosition?: number
    },
    multiDayInfo?: {
      nextDayStart?: Date,
      chipsCarryover?: number,
      dayEndedWithoutElimination?: boolean
    }
  ) => {
    console.log('=== MULTI-DAY COMPLETION ===');
    console.log('Is eliminated:', isEliminated);
    console.log('Multi-day info:', multiDayInfo);
    
    if (pendingTableData) {
      submitTable(pendingTableData, isEliminated, cashOut, notes, bountyInfo, multiDayInfo);
      setPendingTableData(null);
      setShowMultiDayDialog(false);
    }
  };

  const onFormSubmit = (data: TableFormData) => {
    console.log('=== ON FORM SUBMIT CALLED ===');
    console.log('Raw form data:', data);
    console.log('Is multi-day:', data.isMultiDay);
    console.log('Format:', data.format);
    
    handleSubmit(data);
  };

  const onFormError = (errors: any) => {
    console.log('=== FORM VALIDATION ERRORS ===');
    console.log('Errors:', errors);
  };

  // Create a mock table for the multi-day dialog
  const mockTable: TableData = pendingTableData ? {
    id: 'temp',
    name: pendingTableData.name,
    gameType: pendingTableData.gameType,
    format: pendingTableData.format,
    location: sessionLocation,
    buyIn: totalBuyIn,
    initialBuyIn: pendingTableData.initialBuyIn,
    startTime: new Date(),
    isActive: false,
    isMultiDay: pendingTableData.isMultiDay,
    hands: []
  } : {} as TableData;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit, onFormError)} className="space-y-6">
              {/* Game & Format Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Game & Format</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gameType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NLH">No Limit Hold'em</SelectItem>
                            <SelectItem value="PLO">Pot Limit Omaha</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cash">Cash Game</SelectItem>
                            <SelectItem value="Tournament">Tournament</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Online Game Toggle */}
                <FormField
                  control={form.control}
                  name="isOnline"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Online Game</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Multi-Day Tournament Toggle (only for tournaments) */}
                {watchedFormat === 'Tournament' && (
                  <FormField
                    control={form.control}
                    name="isMultiDay"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Multi-Day Tournament</FormLabel>
                          <p className="text-xs text-green-600 font-medium">
                            {watchedIsMultiDay 
                              ? '✅ Will show elimination/continuation dialog after submission'
                              : 'Check this for multi-day tournaments'
                            }
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {watchedFormat === 'Tournament' && (
                  <div>
                    <Label htmlFor="tournamentType">Tournament Type</Label>
                    <Select onValueChange={(value) => form.setValue('tournamentTypes', [value])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tournament type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Freezeout">Freezeout</SelectItem>
                        <SelectItem value="Re-Buy Tournament">Re-Buy Tournament</SelectItem>
                        <SelectItem value="Bounty">Bounty</SelectItem>
                        <SelectItem value="Progressive Bounty (PKO)">Progressive Bounty (PKO)</SelectItem>
                        <SelectItem value="Mystery Bounty">Mystery Bounty</SelectItem>
                        <SelectItem value="Turbo / Hyper">Turbo / Hyper</SelectItem>
                        <SelectItem value="Satellite">Satellite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Financials Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Financials</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="initialBuyIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Buy-in ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <Label htmlFor="rebuys">
                      {watchedFormat === 'Cash' ? 'Rebuys ($)' : 'Rebuys (Count)'}
                    </Label>
                    <Input
                      id="rebuys"
                      type="number"
                      step={watchedFormat === 'Cash' ? "0.01" : "1"}
                      {...form.register(watchedFormat === 'Cash' ? 'rebuysAmount' : 'rebuysCount', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Show rebuys calculation for tournaments */}
                {watchedFormat === 'Tournament' && watchedRebuysCount > 0 && (
                  <div className="text-sm text-gray-600">
                    Total Rebuys Value: ${rebuysValue.toFixed(2)} ({watchedRebuysCount} × ${watchedInitialBuyIn.toFixed(2)})
                  </div>
                )}

                {watchedFormat === 'Cash' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smallBlind">Small Blind ($)</Label>
                        <Input
                          id="smallBlind"
                          type="number"
                          step="0.01"
                          {...form.register('smallBlind', { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bigBlind">Big Blind ($)</Label>
                        <Input
                          id="bigBlind"
                          type="number"
                          step="0.01"
                          {...form.register('bigBlind', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="cashOut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cash Out ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              {watchedFormat === 'Tournament' && (
                <>
                  <Separator />
                  
                  {/* Tournament Results Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Tournament Results</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cashOut"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Regular Payout ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <Label htmlFor="finalPosition">Final Position</Label>
                        <Input
                          id="finalPosition"
                          type="number"
                          {...form.register('finalPosition', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bountyCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Players Eliminated</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bountyAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bounty Payout ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Notes Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Additional Information</h4>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any notes about this table..."
                          className="min-h-[60px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Profit/Loss Display */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">
                  Profit/Loss: 
                  <span className={`ml-2 text-lg ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {watchedFormat === 'Tournament' 
                    ? '(Regular Payout + Bounty Payout) - (Initial Buy-in + Rebuys)'
                    : 'Cash Out - (Initial Buy-in + Rebuys)'
                  }
                </p>
              </div>

              {/* Display validation errors */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <li key={field}>
                        {field}: {error?.message || 'Invalid value'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="poker" className="flex-1">
                  {watchedFormat === 'Tournament' && watchedIsMultiDay 
                    ? 'Add Multi-Day Table' 
                    : 'Add Table'
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PastMultiDayEndDialog
        open={showMultiDayDialog}
        onOpenChange={setShowMultiDayDialog}
        table={mockTable}
        onComplete={handleMultiDayComplete}
      />
    </>
  );
};

export default PastAddTableForm;
