
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
import { TableData } from '@/types/poker';

const editTableSchema = z.object({
  name: z.string().optional(),
  gameType: z.enum(['NLH', 'PLO']),
  format: z.enum(['Cash', 'Tournament']),
  tournamentTypes: z.array(z.string()).optional(),
  buyIn: z.number().min(0),
  initialBuyIn: z.number().min(0),
  rebuys: z.number().min(0).default(0),
  addOns: z.number().min(0).default(0),
  smallBlind: z.number().optional(),
  bigBlind: z.number().optional(),
  startingBB: z.number().optional(),
  cashOut: z.number().min(0).default(0),
  finalPosition: z.number().optional(),
  bountyCount: z.number().min(0).default(0),
  bountyAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

type EditTableFormData = z.infer<typeof editTableSchema>;

interface PastEditTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableData;
  onSubmit: (table: TableData) => void;
}

const PastEditTableForm: React.FC<PastEditTableFormProps> = ({
  open,
  onOpenChange,
  table,
  onSubmit
}) => {
  const form = useForm<EditTableFormData>({
    resolver: zodResolver(editTableSchema),
    defaultValues: {
      name: table.name || '',
      gameType: table.gameType,
      format: table.format,
      tournamentTypes: table.tournamentTypes || [],
      buyIn: table.buyIn,
      initialBuyIn: table.initialBuyIn,
      rebuys: table.rebuys || 0,
      addOns: table.addOns || 0,
      smallBlind: table.smallBlind,
      bigBlind: table.bigBlind,
      startingBB: table.startingBB,
      cashOut: table.cashOut || 0,
      finalPosition: table.finalPosition,
      bountyCount: table.bountyCount || 0,
      bountyAmount: table.bountyAmount || 0,
      notes: table.notes || '',
    },
  });

  const watchedFormat = form.watch('format');
  const watchedBuyIn = form.watch('buyIn');
  const watchedCashOut = form.watch('cashOut');

  const profitLoss = watchedCashOut - watchedBuyIn;

  const handleSubmit = (data: EditTableFormData) => {
    const updatedTable: TableData = {
      ...table,
      ...data,
    };
    
    onSubmit(updatedTable);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Table Name (Optional)</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Custom table name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gameType">Game Type</Label>
              <Select 
                onValueChange={(value) => form.setValue('gameType', value as 'NLH' | 'PLO')} 
                defaultValue={table.gameType}
              >
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
              <Select 
                onValueChange={(value) => form.setValue('format', value as 'Cash' | 'Tournament')} 
                defaultValue={table.format}
              >
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
              <Label htmlFor="cashOut">Cash Out ($)</Label>
              <Input
                id="cashOut"
                type="number"
                step="0.01"
                {...form.register('cashOut', { valueAsNumber: true })}
              />
            </div>
          </div>

          {watchedFormat === 'Cash' && (
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
          )}

          {watchedFormat === 'Tournament' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="finalPosition">Final Position</Label>
                <Input
                  id="finalPosition"
                  type="number"
                  {...form.register('finalPosition', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="bountyCount">Bounties</Label>
                <Input
                  id="bountyCount"
                  type="number"
                  {...form.register('bountyCount', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="bountyAmount">Bounty Amount ($)</Label>
                <Input
                  id="bountyAmount"
                  type="number"
                  step="0.01"
                  {...form.register('bountyAmount', { valueAsNumber: true })}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Any notes about this table..."
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">
              Profit/Loss: 
              <span className={`ml-2 ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
              </span>
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="poker" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PastEditTableForm;
