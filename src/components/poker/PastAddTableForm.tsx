
import React from 'react';
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
import { TableData } from '@/types/poker';

const tableSchema = z.object({
  name: z.string().optional(),
  gameType: z.enum(['NLH', 'PLO']),
  format: z.enum(['Cash', 'Tournament']),
  tournamentTypes: z.array(z.string()).optional(),
  buyIn: z.number().min(0),
  initialBuyIn: z.number().min(0),
  rebuysCount: z.number().min(0).default(0),
  smallBlind: z.number().optional(),
  bigBlind: z.number().optional(),
  startingBB: z.number().optional(),
  cashOut: z.number().min(0).default(0),
  finalPosition: z.number().optional(),
  bountyCount: z.number().min(0).default(0),
  bountyAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
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
  const form = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      gameType: 'NLH',
      format: 'Cash',
      buyIn: 0,
      initialBuyIn: 0,
      rebuysCount: 0,
      cashOut: 0,
      bountyCount: 0,
      bountyAmount: 0,
    },
  });

  const watchedFormat = form.watch('format');
  const watchedInitialBuyIn = form.watch('initialBuyIn');
  const watchedRebuysCount = form.watch('rebuysCount');
  const watchedCashOut = form.watch('cashOut');
  const watchedBountyAmount = form.watch('bountyAmount');

  // Calculate total rebuys value (count × initial buy-in)
  const totalRebuysValue = watchedRebuysCount * watchedInitialBuyIn;
  
  // Calculate total buy-in (initial + rebuys value)
  const totalBuyIn = watchedInitialBuyIn + totalRebuysValue;

  // Calculate profit/loss: (Cash Out + Bounty Amount) - Total Buy-in
  const profitLoss = (watchedCashOut + (watchedFormat === 'Tournament' ? watchedBountyAmount : 0)) - totalBuyIn;

  const handleSubmit = (data: TableFormData) => {
    const tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'> = {
      name: data.name,
      gameType: data.gameType,
      format: data.format,
      location: sessionLocation,
      buyIn: totalBuyIn, // Use calculated total buy-in
      initialBuyIn: data.initialBuyIn,
      cashOut: data.cashOut,
      smallBlind: data.smallBlind,
      bigBlind: data.bigBlind,
      endTime: new Date(),
      rebuys: totalRebuysValue, // Store the monetary value, not count
      addOns: 0,
      notes: data.notes,
      finalPosition: data.finalPosition,
      startingBB: data.startingBB,
      bountyCount: data.bountyCount,
      bountyAmount: data.bountyAmount,
      tournamentTypes: data.tournamentTypes,
      hands: []
    };
    
    onSubmit(tableData);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Table</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Game & Format Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Game & Format</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gameType">Game Type</Label>
                <Select onValueChange={(value) => form.setValue('gameType', value as 'NLH' | 'PLO')} defaultValue="NLH">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NLH">No Limit Hold'em</SelectItem>
                    <SelectItem value="PLO">Pot Limit Omaha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="format">Format</Label>
                <Select onValueChange={(value) => form.setValue('format', value as 'Cash' | 'Tournament')} defaultValue="Cash">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash Game</SelectItem>
                    <SelectItem value="Tournament">Tournament</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
              <div>
                <Label htmlFor="initialBuyIn">Initial Buy-in ($)</Label>
                <Input
                  id="initialBuyIn"
                  type="number"
                  step="0.01"
                  {...form.register('initialBuyIn', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="rebuysCount">Rebuys (Count)</Label>
                <Input
                  id="rebuysCount"
                  type="number"
                  {...form.register('rebuysCount', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Show total rebuys value when there are rebuys */}
            {watchedRebuysCount > 0 && (
              <div className="text-sm text-gray-600">
                Total Rebuys Value: ${totalRebuysValue.toFixed(2)} ({watchedRebuysCount} × ${watchedInitialBuyIn.toFixed(2)})
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
                
                <div>
                  <Label htmlFor="cashOut">Cash Out ($)</Label>
                  <Input
                    id="cashOut"
                    type="number"
                    step="0.01"
                    {...form.register('cashOut', { valueAsNumber: true })}
                  />
                </div>
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
                  <div>
                    <Label htmlFor="cashOut">Regular Payout ($)</Label>
                    <Input
                      id="cashOut"
                      type="number"
                      step="0.01"
                      {...form.register('cashOut', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bountyAmount">Bounty Payout ($)</Label>
                    <Input
                      id="bountyAmount"
                      type="number"
                      step="0.01"
                      {...form.register('bountyAmount', { valueAsNumber: true })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="finalPosition">Final Position</Label>
                    <Input
                      id="finalPosition"
                      type="number"
                      {...form.register('finalPosition', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bountyCount">Players Eliminated</Label>
                    <Input
                      id="bountyCount"
                      type="number"
                      {...form.register('bountyCount', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Notes Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Additional Information</h4>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Any notes about this table..."
                className="min-h-[60px]"
              />
            </div>
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

          <div className="flex gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="poker" className="flex-1">
              Add Table
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PastAddTableForm;
