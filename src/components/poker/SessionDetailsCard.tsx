
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokerSession } from '@/types/poker';
import { Badge } from "@/components/ui/badge";
import { DollarSign, CircleDollarSign } from "lucide-react";

interface SessionDetailsCardProps {
  session: PokerSession;
}

const SessionDetailsCard: React.FC<SessionDetailsCardProps> = ({ session }) => {
  const tables = session.tables || [];

  let totalInitialBuyin = 0, totalRebuyAmount = 0, rebuyCount = 0;
  tables.forEach((t) => {
    totalInitialBuyin += t.initialBuyIn || 0;
    if (t.rebuys && t.rebuys > 0) {
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
          <div className="flex items-center gap-2 mt-1 mb-1">
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-gray-300 bg-gray-100 text-gray-800 px-3 py-1 font-normal text-sm"
            >
              <DollarSign className="w-4 h-4 text-gray-600" />
              <span className="font-bold">${totalInitialBuyin.toFixed(2)}</span>
              <span className="ml-1 opacity-80 text-xs">
                Buy-In {tableCount ? `(${tableCount} table${tableCount !== 1 ? "s" : ""})` : ""}
              </span>
            </Badge>
            {totalRebuyAmount > 0 || rebuyCount > 0 ? (
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-gray-300 bg-gray-100 text-gray-800 px-3 py-1 font-normal text-sm"
              >
                <CircleDollarSign className="w-4 h-4 text-gray-600" />
                <span className="font-bold">
                  +${totalRebuyAmount.toFixed(2)}
                </span>
                <span className="ml-1 opacity-80 text-xs">
                  from {rebuyCount} rebuy{rebuyCount !== 1 ? "s" : ""}
                </span>
              </Badge>
            ) : null}
          </div>

          {(session.smallBlind && session.bigBlind) ? (
            <div className="flex justify-between">
              <span className="text-gray-500">Blinds:</span>
              <span className="font-medium">${session.smallBlind}/{session.bigBlind}</span>
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

