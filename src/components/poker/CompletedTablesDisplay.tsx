
import React from 'react';
import { format } from 'date-fns';
import TableTimerDisplay from '@/components/poker/TableTimerDisplay';
import { TableData } from '@/types/poker';

interface CompletedTablesDisplayProps {
  tables: TableData[];
}

export default function CompletedTablesDisplay({ tables }: CompletedTablesDisplayProps) {
  if (tables.length === 0) return null;

  return (
    <div>
      <h4 className="text-lg font-bold mb-2">Completed Tables</h4>
      <div className="space-y-4">
        {tables.map((table) => {
          // COMPLETELY REBUILT: New Total Payout Logic
          // Calculate as Buy-in + Profit/Loss, ensuring never negative
          const profitLoss = (table.cashOut ?? 0) - table.buyIn;
          const newTotalPayout = Math.max(table.buyIn + profitLoss, table.buyIn);
          
          console.log('CompletedTablesDisplay - REBUILT Total Payout Logic for table:', table.id);
          console.log('CompletedTablesDisplay - buyIn:', table.buyIn);
          console.log('CompletedTablesDisplay - cashOut:', table.cashOut);
          console.log('CompletedTablesDisplay - profitLoss:', profitLoss);
          console.log('CompletedTablesDisplay - newTotalPayout (buyIn + profitLoss, min buyIn):', newTotalPayout);
          
          return (
            <div 
              key={table.id} 
              className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">{table.name || table.location}</h3>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">{table.location}</p>
                  <p className="text-sm text-gray-600">{table.gameType} • {table.format}</p>
                  {table.isMultiDay && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-poker-feltGreen/10 text-poker-feltGreen rounded-full text-xs">
                      Multi-Day
                    </span>
                  )}
                </div>
                {table.cashOut !== undefined && !table.dayEndedWithoutElimination && (
                  <div className={`text-lg font-bold ${
                    table.cashOut >= table.buyIn ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {table.cashOut >= table.buyIn ? '+' : ''}
                    ${(table.cashOut - table.buyIn).toFixed(2)}
                  </div>
                )}
              </div>
              
              {/* Redesigned Start, Duration, End row with better visual balance */}
              <div className="flex justify-center items-center mb-4 text-sm border-b border-gray-100 pb-4">
                <div className="flex flex-1 justify-center items-center">
                  <div className="text-center">
                    <div className="text-gray-500 font-medium text-xs uppercase mb-1">Start</div>
                    <div className="font-medium">{format(new Date(table.startTime), 'MMM d, h:mm a')}</div>
                  </div>
                </div>
                
                {table.startTime && table.endTime && (
                  <div className="flex-1 flex justify-center items-center border-x border-gray-100 px-4">
                    <div className="text-center">
                      <div className="text-gray-500 font-medium text-xs uppercase mb-1">Duration</div>
                      <TableTimerDisplay 
                        startTime={table.startTime} 
                        endTime={table.endTime}
                        isActive={false}
                        className="flex justify-center"
                      />
                    </div>
                  </div>
                )}
                
                {table.endTime && (
                  <div className="flex-1 flex justify-center items-center">
                    <div className="text-center">
                      <div className="text-gray-500 font-medium text-xs uppercase mb-1">End</div>
                      <div className="font-medium">{format(new Date(table.endTime), 'MMM d, h:mm a')}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Styled Buy-in and Rebuy section with rebuy count */}
              <div className="flex items-center gap-4 mb-4 justify-center">
                <div className="text-right">
                  <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">BUY-IN</span>
                  <span className="font-bold text-xl">
                    ${(table.initialBuyIn ?? table.buyIn).toFixed(2)}
                  </span>
                </div>
                {(() => {
                  const rebuyTotal = (table.buyIn - (table.initialBuyIn ?? table.buyIn));
                  const addOnTotal = table.addOns ? table.addOns : 0;
                  const extra = rebuyTotal + addOnTotal;
                  const rebuyCount = Math.floor(rebuyTotal / (table.initialBuyIn ?? table.buyIn));
                  return extra > 0 ? (
                    <div className="text-right">
                      <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">REBUY</span>
                      <div>
                        <span className="font-bold text-xl text-amber-600">
                          +${extra.toFixed(2)}
                        </span>
                        {rebuyCount > 0 && (
                          <span className="text-sm text-gray-500 ml-1">({rebuyCount})</span>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              
              {/* Tournament-specific fields */}
              <div className="text-xs space-y-1 mb-4">
                {table.format === 'Tournament' && table.startingBB && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Starting BBs:</span>
                    <span className="font-medium">{table.startingBB}BB</span>
                  </div>
                )}
                
                {table.tournamentTypes && table.tournamentTypes.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tournament Type:</span>
                    <span className="inline-flex px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                      {table.tournamentTypes[0]}
                    </span>
                  </div>
                )}
                
                {table.format === 'Tournament' && 
                table.tournamentTypes?.some(type => ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)) && 
                table.bountyCount !== undefined && 
                table.bountyCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Players Eliminated:</span>
                    <span className="font-medium">{table.bountyCount}</span>
                  </div>
                )}
                
                {table.format === 'Tournament' && 
                table.tournamentTypes?.some(type => ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)) && 
                table.bountyAmount !== undefined && 
                table.bountyAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bounty Collected:</span>
                    <span className="font-medium text-poker-gold">${table.bountyAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {/* Multi-day tournament continuation details */}
              {table.dayEndedWithoutElimination && (
                <div className="bg-poker-feltGreen/5 p-3 rounded-lg mb-4 border border-poker-feltGreen/20">
                  <h5 className="font-bold text-sm text-poker-feltGreen mb-2">Tournament Continuing</h5>
                  
                  {table.chipsCarryover && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Continuing with:</span>
                      <span className="font-medium">{table.chipsCarryover.toLocaleString()} chips</span>
                    </div>
                  )}
                  
                  {table.nextDayStart && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Next Day:</span>
                      <span className="font-medium">{format(new Date(table.nextDayStart), 'MMM d, h:mm a')}</span>
                    </div>
                  )}
                  
                  {/* We don't have explicit day tracking in the data model, 
                     so we're showing a generic continuation message */}
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">Day completed, continuing</span>
                  </div>
                  
                  {table.notes && (
                    <div className="mt-2 pt-2 border-t border-poker-feltGreen/10">
                      <p className="text-xs text-gray-600 italic">"{table.notes}"</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* COMPLETELY REBUILT: Total Payout display using new logic */}
              <div className="flex flex-col items-center justify-center mt-4 mb-2">
                <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">
                  {table.dayEndedWithoutElimination ? 'STATUS' : 'TOTAL PAYOUT'}
                </span>
                {table.dayEndedWithoutElimination ? (
                  <span className="font-bold text-xl text-poker-feltGreen">Continuing</span>
                ) : (
                  <span className="font-bold text-xl text-poker-gold">
                    ${newTotalPayout.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
