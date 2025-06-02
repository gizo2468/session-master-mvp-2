
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableData } from '@/types/poker';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import TableTimerDisplay from './TableTimerDisplay';
import ProfitLossBadge from './ProfitLossBadge';

interface TableDetailsCardProps {
  table: TableData;
}

export const TableDetailsCard: React.FC<TableDetailsCardProps> = ({ table }) => {
  // Calculate total payout (sum of regular payout and bounty payout for bounty tournaments)
  const totalPayout = (() => {
    const isBountyTournament = table.tournamentTypes?.some(type => 
      ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
    );
    
    if (isBountyTournament && table.bountyAmount !== undefined) {
      return (table.cashOut ?? 0) + table.bountyAmount;
    }
    
    return table.cashOut ?? 0;
  })();
  
  // Calculate profit based on total payout
  const profit = totalPayout - (table.buyIn ?? 0);
  const formattedStart = format(new Date(table.startTime), 'MMM d, h:mm a');
  const formattedEnd = table.endTime ? format(new Date(table.endTime), 'MMM d, h:mm a') : null;
  const rebuyAmount = (table.buyIn - (table.initialBuyIn || 0)) > 0 ? table.buyIn - (table.initialBuyIn || 0) : 0;
  const isBountyTournament = table.tournamentTypes?.some(type => 
    ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
  );
  const isMobile = useIsMobile();
  
  // Format next day start date if available
  const formattedNextDayStart = table.nextDayStart 
    ? format(new Date(table.nextDayStart), 'MMM d, h:mm a') 
    : null;
  
  // Check if this is a multi-day tournament that ended a day without elimination
  const isMultiDayContinuing = table.isMultiDay && table.dayEndedWithoutElimination;

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div>
            <span>{table.location}</span>
            <span className="text-sm text-gray-500 font-normal ml-2">
              {table.gameType} • {table.format}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs uppercase font-medium tracking-wider mb-1">Profit/Loss</span>
            <ProfitLossBadge profit={profit} size="md" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Redesigned Start, Duration, End row with better visual balance */}
        <div className="flex justify-center items-center mb-6 text-sm border-b border-gray-100 pb-4">
          <div className="flex flex-1 justify-center items-center">
            <div className="text-center">
              <div className="text-gray-500 font-medium text-xs uppercase mb-1">Start</div>
              <div className="font-medium">{formattedStart}</div>
            </div>
          </div>
          
          {table.startTime && table.endTime && (
            <div className="flex-1 flex justify-center items-center border-x border-gray-100 px-4">
              <div className="text-center">
                <div className="text-gray-500 font-medium text-xs uppercase mb-1">Duration</div>
                <TableTimerDisplay 
                  startTime={new Date(table.startTime)} 
                  endTime={new Date(table.endTime)}
                  isActive={false}
                  className="flex justify-center"
                />
              </div>
            </div>
          )}
          
          {formattedEnd && (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-center">
                <div className="text-gray-500 font-medium text-xs uppercase mb-1">End</div>
                <div className="font-medium">{formattedEnd}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Multi-Day Tournament Continuation Info */}
        {isMultiDayContinuing && (
          <div className="flex justify-center items-center mb-6 text-sm border-b border-gray-100 pb-4 bg-green-50 rounded-md p-2">
            {formattedNextDayStart && (
              <div className="flex-1 flex justify-center items-center">
                <div className="text-center">
                  <div className="text-green-600 font-medium text-xs uppercase mb-1">Next Day Starts</div>
                  <div className="font-medium text-green-800">{formattedNextDayStart}</div>
                </div>
              </div>
            )}
            
            {table.chipsCarryover && (
              <div className="flex-1 flex justify-center items-center border-l border-gray-100 pl-4">
                <div className="text-center">
                  <div className="text-green-600 font-medium text-xs uppercase mb-1">Chips Carried Over</div>
                  <div className="font-medium text-green-800">{table.chipsCarryover.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Styled Buy-in and Rebuy section with centered alignment */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">BUY-IN</span>
            <span className="font-bold text-2xl">
              ${table.initialBuyIn?.toFixed(2) ?? table.buyIn.toFixed(2)}
            </span>
          </div>
          {rebuyAmount > 0 && (
            <div className="text-center">
              <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">REBUY</span>
              <span className="font-bold text-2xl text-red-600">
                +${rebuyAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        
        {/* Condensed fields into a single row with separators */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-4">
          {table.format === 'Tournament' && table.startingBB && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Starting BBs:</span>
              <span>{table.startingBB}BB</span>
            </div>
          )}
          
          {table.format === 'Tournament' && table.startingBB && table.tournamentTypes && table.tournamentTypes.length > 0 && (
            <span className="text-gray-400">•</span>
          )}
          
          {table.tournamentTypes && table.tournamentTypes.length > 0 && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Tournament Type:</span>
              <span className="flex flex-wrap gap-1">
                {table.tournamentTypes.map((type, index) => (
                  <React.Fragment key={type}>
                    {index > 0 && <span>,</span>}
                    <span>{type}</span>
                  </React.Fragment>
                ))}
              </span>
            </div>
          )}
        </div>
        
        {/* Additional tournament-specific fields */}
        {isBountyTournament && (table.bountyCount !== undefined || table.bountyAmount !== undefined) && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
            {table.bountyCount !== undefined && table.bountyCount > 0 && (
              <div>
                <span className="text-gray-500">Players Eliminated:</span>
                <div>{table.bountyCount}</div>
              </div>
            )}
            {table.bountyAmount !== undefined && table.bountyAmount > 0 && (
              <div>
                <span className="text-gray-500">Bounty Payout:</span>
                <div className="text-poker-gold font-medium">${table.bountyAmount.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}
        
        {/* Multi-Day Tournament Status Badge */}
        {table.isMultiDay && (
          <div className="flex justify-center mb-4">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              isMultiDayContinuing 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isMultiDayContinuing 
                ? 'Continuing to Next Day' 
                : 'Multi-Day Tournament'}
            </div>
          </div>
        )}
        
        {/* Repositioned Total Payout to be more prominent - DISPLAY REGULAR PAYOUT FIRST */}
        {table.cashOut !== undefined && !isMultiDayContinuing && (
          <div className="flex flex-col items-center justify-center mt-4 mb-2">
            {/* Regular Payout Line (new) */}
            <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">REGULAR PAYOUT</span>
            <span className="font-bold text-2xl text-poker-gold">
              ${(table.cashOut ?? 0).toFixed(2)}
            </span>
            
            {/* Only show Total Payout as separate line if there's a bounty amount */}
            {isBountyTournament && table.bountyAmount && table.bountyAmount > 0 && (
              <>
                <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider mt-2">TOTAL PAYOUT</span>
                <span className="font-bold text-2xl text-poker-gold">
                  ${totalPayout.toFixed(2)}
                </span>
              </>
            )}
          </div>
        )}
        
        {table.notes && (
          <div className="mt-2">
            <span className="text-gray-500 block mb-1">Notes:</span>
            <div className="text-xs bg-gray-50 p-2 rounded">{table.notes}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableDetailsCard;
