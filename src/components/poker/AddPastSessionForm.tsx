import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const pastSessionSchema = z.object({
  gameType: z.enum(['NLH', 'PLO']),
  format: z.enum(['Cash', 'Tournament']),
  tournamentType: z.string().optional(),
  isMultiDay: z.boolean().default(false),
  isOnline: z.boolean().default(false),
  location: z.string().min(1, 'Table name/location is required'),
  buyIn: z.number().min(0, 'Buy-in must be 0 or greater'),
  rebuys: z.number().min(0).default(0),
  rebuyAmount: z.number().min(0).default(0),
  smallBlind: z.number().optional(),
  bigBlind: z.number().optional(),
  startTime: z.date(),
  endTime: z.date(),
  playersEliminated: z.number().min(0).default(0),
  bountyCollected: z.number().min(0).default(0),
  regularPayout: z.number().min(0).default(0),
  cashOut: z.number().min(0),
  notes: z.string().optional(),
});

type PastSessionFormData = z.infer<typeof pastSessionSchema>;

interface AddPastSessionFormProps {
  onClose: () => void;
}

const AddPastSessionForm: React.FC<AddPastSessionFormProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { addSession } = useSessionContext();
  const { toast } = useToast();
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  const form = useForm<PastSessionFormData>({
    resolver: zodResolver(pastSessionSchema),
    defaultValues: {
      gameType: 'NLH',
      format: 'Cash',
      isMultiDay: false,
      isOnline: false,
      buyIn: 0,
      rebuys: 0,
      rebuyAmount: 0,
      playersEliminated: 0,
      bountyCollected: 0,
      regularPayout: 0,
      cashOut: 0,
      startTime: new Date(),
      endTime: new Date(),
    },
  });

  const watchedFormat = form.watch('format');
  const watchedBuyIn = form.watch('buyIn');
  const watchedRebuys = form.watch('rebuys');
  const watchedRebuyAmount = form.watch('rebuyAmount');
  const watchedCashOut = form.watch('cashOut');

  // Calculate total investment and profit/loss
  const totalInvestment = watchedBuyIn + (watchedRebuys * watchedRebuyAmount);
  const profitLoss = watchedCashOut - totalInvestment;

  const onSubmit = (data: PastSessionFormData) => {
    try {
      const sessionDuration = Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60)); // minutes
      
      const newSession = {
        id: uuidv4(),
        gameType: data.gameType,
        format: data.format,
        tournamentType: data.tournamentType,
        isMultiDay: data.isMultiDay,
        isOnline: data.isOnline,
        location: data.location,
        buyIn: totalInvestment,
        initialBuyIn: data.buyIn,
        rebuys: data.rebuys,
        rebuyAmount: data.rebuyAmount,
        smallBlind: data.smallBlind || 0,
        bigBlind: data.bigBlind || 0,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: false,
        currentStatus: 'ended' as const,
        sessionDuration,
        cashOut: data.cashOut,
        playersEliminated: data.playersEliminated,
        bountyCollected: data.bountyCollected,
        regularPayout: data.regularPayout,
        notes: data.notes,
        hands: [],
      };

      addSession(newSession);
      
      toast({
        title: 'Past Session Added',
        description: 'Your past session has been successfully recorded.',
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem saving your session.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={onClose} 
            variant="ghost"
            className="mb-4"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Add Past Session</h1>
          <p className="text-gray-600">Record a session you've already played</p>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {watchedFormat === 'Tournament' && (
                <div>
                  <Label htmlFor="tournamentType">Tournament Type</Label>
                  <Select onValueChange={(value) => form.setValue('tournamentType', value)}>
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isMultiDay"
                  checked={form.watch('isMultiDay')}
                  onCheckedChange={(checked) => form.setValue('isMultiDay', !!checked)}
                />
                <Label htmlFor="isMultiDay">Multi-Day Tournament</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isOnline"
                  checked={form.watch('isOnline')}
                  onCheckedChange={(checked) => form.setValue('isOnline', !!checked)}
                />
                <Label htmlFor="isOnline">Online Game</Label>
              </div>

              <div>
                <Label htmlFor="location">Table Name / Location</Label>
                <Input
                  id="location"
                  {...form.register('location')}
                  placeholder="Casino name or online site"
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.location.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stakes & Buy-in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="buyIn">Initial Buy-in Amount ($)</Label>
                <Input
                  id="buyIn"
                  type="number"
                  step="0.01"
                  {...form.register('buyIn', { valueAsNumber: true })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rebuys">Number of Rebuys</Label>
                  <Input
                    id="rebuys"
                    type="number"
                    {...form.register('rebuys', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="rebuyAmount">Rebuy Amount ($)</Label>
                  <Input
                    id="rebuyAmount"
                    type="number"
                    step="0.01"
                    {...form.register('rebuyAmount', { valueAsNumber: true })}
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

              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">Total Investment: ${totalInvestment.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch('startTime') && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('startTime') ? format(form.watch('startTime'), "PPP p") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('startTime')}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue('startTime', date);
                            setStartTimeOpen(false);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Time</Label>
                  <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch('endTime') && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('endTime') ? format(form.watch('endTime'), "PPP p") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('endTime')}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue('endTime', date);
                            setEndTimeOpen(false);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {watchedFormat === 'Tournament' && (
                <>
                  <div>
                    <Label htmlFor="playersEliminated">Players Eliminated</Label>
                    <Input
                      id="playersEliminated"
                      type="number"
                      {...form.register('playersEliminated', { valueAsNumber: true })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bountyCollected">Total Bounty Collected ($)</Label>
                    <Input
                      id="bountyCollected"
                      type="number"
                      step="0.01"
                      {...form.register('bountyCollected', { valueAsNumber: true })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="regularPayout">Regular Payout ($)</Label>
                    <Input
                      id="regularPayout"
                      type="number"
                      step="0.01"
                      {...form.register('regularPayout', { valueAsNumber: true })}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="cashOut">Cash Out Amount ($)</Label>
                <Input
                  id="cashOut"
                  type="number"
                  step="0.01"
                  {...form.register('cashOut', { valueAsNumber: true })}
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

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Any additional notes about the session..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="poker" className="flex-1">
              Save Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPastSessionForm;
