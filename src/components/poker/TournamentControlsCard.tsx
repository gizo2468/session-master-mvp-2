
import React from 'react';
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
import { PokerSession } from '@/types/poker';

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

  const handleConfirmRebuy = () => {
    onAddRebuy(rebuyAmount);
  };

  return (
    <Card className="bg-white rounded-lg shadow-md mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Tournament Controls</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex justify-center items-center gap-2"
              >
                <Icon name="Plus" size={16} /> Add Rebuy
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Rebuy</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to add a Rebuy for ${rebuyAmount.toFixed(2)}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmRebuy} className="bg-poker-gold hover:bg-poker-darkGold text-white">
                  Confirm Rebuy
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentControlsCard;
