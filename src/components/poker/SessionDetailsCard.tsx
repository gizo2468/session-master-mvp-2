
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokerSession } from '@/types/poker';

interface SessionDetailsCardProps {
  session: PokerSession;
}

const SessionDetailsCard: React.FC<SessionDetailsCardProps> = ({ session }) => {
  // New buy-in/display logic for summary:
  // TOTAL_BUYIN_AMOUNT: sum of initial buy-ins across tables
  // TABLE_COUNT: number of tables in session
  // TOTAL_REBUY_AMOUNT: sum of all rebuys across tables (amount, not count)
  // REBUY_COUNT: total count of rebuys across all tables
  
  const tables = session.tables || [];

  // Calculate total initial buyin and rebuys
  let totalInitialBuyin = 0, totalRebuyAmount = 0, rebuyCount = 0;
  tables.forEach((t) => {
    totalInitialBuyin += t.initialBuyIn || 0;
    if (t.rebuys && t.rebuys > 0) {
      // Rebuy amount = (t.buyIn - t.initialBuyIn)
      totalRebuyAmount += (t.buyIn - t.initialBuyIn);
      rebuyCount += t.rebuys;
    }
  });
  const tableCount = tables.length;

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
          {/* Updated buy-in logic */}
          <div className="flex justify-between">
            <span className="text-gray-500">Buy-in:</span>
            <span className="font-medium">
              ${totalInitialBuyin.toFixed(2)} for {tableCount} table{tableCount !== 1 ? "s" : ""}
              {(totalRebuyAmount > 0 || rebuyCount > 0) && (
                <span className="text-gray-600">
                  {" "}
                  (+${totalRebuyAmount.toFixed(2)} from {rebuyCount} rebuy{rebuyCount !== 1 ? "s" : ""})
                </span>
              )}
            </span>
          </div>
          
          {(session.smallBlind && session.bigBlind) ? (
            <div className="flex justify-between">
              <span className="text-gray-500">Blinds:</span>
              <span className="font-medium">${session.smallBlind}/${session.bigBlind}</span>
            </div>
          ) : null}
          
          {session.format === 'Tournament' && (
            <>
              {(session.rebuys && session.rebuys > 0) && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Rebuys:</span>
                  <span className="font-medium">{session.rebuys}</span>
                </div>
              )}
              
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
