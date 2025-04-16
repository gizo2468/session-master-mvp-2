
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokerSession } from '@/types/poker';

interface SessionDetailsCardProps {
  session: PokerSession;
}

const SessionDetailsCard: React.FC<SessionDetailsCardProps> = ({ session }) => {
  // Calculate the total of rebuys and addons
  const calculateAdditionalBuyins = () => {
    if (session.initialBuyIn) {
      // If initialBuyIn exists, return the difference between total and initial
      return session.buyIn - session.initialBuyIn;
    }
    
    // Fallback calculation (for backward compatibility)
    let additional = 0;
    
    if (session.rebuys && session.rebuys > 0) {
      additional += ((session.rebuys || 0) * (session.tournamentBuyIn || session.buyIn / session.rebuys));
    }
    
    if (session.addOns && session.addOns > 0) {
      additional += ((session.addOns || 0) * (session.tournamentBuyIn || session.buyIn / session.addOns));
    }
    
    return additional;
  };
  
  const additionalBuyins = calculateAdditionalBuyins();
  const initialBuyIn = session.initialBuyIn || (session.buyIn - additionalBuyins);
  
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Session Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Location:</span>
            <span className="font-medium">{session.location}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Buy-in:</span>
            <span className="font-medium">
              ${initialBuyIn.toFixed(2)}
              {additionalBuyins > 0 && <span className="text-gray-600"> (+${additionalBuyins.toFixed(2)})</span>}
            </span>
          </div>
          
          {(session.rebuys && session.rebuys > 0) && (
            <div className="flex justify-between">
              <span className="text-gray-500">Rebuys:</span>
              <span className="font-medium">${(session.rebuys * (session.tournamentBuyIn || session.buyIn / session.rebuys)).toFixed(2)}</span>
            </div>
          )}
          
          {(session.smallBlind && session.bigBlind) ? (
            <div className="flex justify-between">
              <span className="text-gray-500">Blinds:</span>
              <span className="font-medium">${session.smallBlind}/${session.bigBlind}</span>
            </div>
          ) : null}
          
          {session.format === 'Tournament' && (
            <>
              {(session.addOns && session.addOns > 0) && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Add-ons:</span>
                  <span className="font-medium">{session.addOns}</span>
                </div>
              )}
            </>
          )}
          
          {session.notes && (
            <div className="pt-2">
              <span className="text-gray-500 block mb-1">Notes:</span>
              <p className="text-sm bg-gray-50 p-3 rounded">{session.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionDetailsCard;
