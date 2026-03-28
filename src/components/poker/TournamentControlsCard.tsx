
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PokerSession } from '@/types/poker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TournamentControlsCardProps {
  session: PokerSession;
  onAddRebuy: (amount: number) => void;
}

const TournamentControlsCard: React.FC<TournamentControlsCardProps> = ({ 
  session,
  onAddRebuy
}) => {
  // Calculate the original buy-in amount
  const rebuyAmount = session.initialBuyIn || session.tournamentBuyIn || session.buyIn;
  const [isRebuyDialogOpen, setIsRebuyDialogOpen] = useState(false);
  const [customRebuyAmount, setCustomRebuyAmount] = useState('');
  
  // Check if this is a Freezeout tournament
  const isFreezeout = session.format === 'Tournament' && 
                      session.tables?.some(table => 
                        table.tournamentTypes?.includes('Freezeout')
                      );
  
  const handleConfirmRebuy = () => {
    onAddRebuy(rebuyAmount);
  };

  const handleConfirmCustomRebuy = () => {
    const amount = parseFloat(customRebuyAmount);
    if (!isNaN(amount) && amount > 0) {
      onAddRebuy(amount);
      setIsRebuyDialogOpen(false);
      setCustomRebuyAmount('');
    }
  };

  // If there are no active tables or tables at all, don't show the controls
  const hasActiveTables = session.tables?.some(table => table.isActive) ?? false;
  if (!hasActiveTables && (session.tables?.length ?? 0) > 0) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-card rounded-lg shadow-md mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {session.format === 'Tournament' ? 'Tournament Controls' : 'Cash Game Controls'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          {session.format === 'Tournament' ? (
            // Tournament rebuy control - show disabled for Freezeout
            isFreezeout ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full flex justify-center items-center gap-2 opacity-50 cursor-not-allowed"
                      disabled={true}
                    >
                      <Icon name="Plus" size={16} /> Add Rebuy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rebuys not allowed in Freezeout tournaments</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              // Updated tournament rebuy dialog with badge-style display
              <Dialog open={isRebuyDialogOpen} onOpenChange={setIsRebuyDialogOpen}>
                <Button
                  variant="outline"
                  className="w-full flex justify-center items-center gap-2"
                  onClick={() => setIsRebuyDialogOpen(true)}
                >
                  <Icon name="Plus" size={16} /> Add Rebuy
                </Button>
                
                <DialogContent className="max-w-sm">
                  <DialogHeader className="text-center">
                    <DialogTitle>Tournament Rebuy</DialogTitle>
                    <DialogDescription className="sr-only">
                      Confirm your tournament rebuy
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex flex-col items-center space-y-6 py-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-3">Rebuy Amount</p>
                      <Badge variant="outline" className="px-6 py-3 text-2xl font-bold border-2 border-poker-gold text-poker-gold">
                        ${rebuyAmount.toFixed(2)}
                      </Badge>
                    </div>
                    
                    <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
                      Do you want to rebuy for this amount?
                    </p>
                  </div>
                  
                  <DialogFooter className="flex-col space-y-2 sm:flex-col sm:space-x-0 sm:space-y-2">
                    <Button
                      onClick={handleConfirmRebuy}
                      className="w-full bg-poker-gold hover:bg-poker-darkGold text-white"
                    >
                      Yes, Rebuy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsRebuyDialogOpen(false)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )
          ) : (
            // Cash game flexible rebuy - no changes needed
            <>
              <Button
                variant="outline"
                className="w-full flex justify-center items-center gap-2"
                onClick={() => setIsRebuyDialogOpen(true)}
              >
                <Icon name="Plus" size={16} /> Add Rebuy
              </Button>
              
              <Dialog open={isRebuyDialogOpen} onOpenChange={setIsRebuyDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Cash Game Rebuy</DialogTitle>
                    <DialogDescription>
                      Enter the amount you want to add as a rebuy.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <label htmlFor="rebuy-amount" className="text-sm font-medium mb-2 block">
                      Rebuy Amount
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-muted-foreground">$</span>
                      </div>
                      <Input
                        id="rebuy-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8"
                        value={customRebuyAmount}
                        onChange={(e) => setCustomRebuyAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsRebuyDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmCustomRebuy}
                      disabled={!customRebuyAmount || parseFloat(customRebuyAmount) <= 0}
                      className="bg-poker-gold hover:bg-poker-darkGold text-white"
                    >
                      Add Rebuy
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentControlsCard;
