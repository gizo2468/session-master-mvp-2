
import { useSessionContext } from '@/context/SessionContext';

export default function StatsQuickView() {
  const { sessions } = useSessionContext();
  
  // Calculate stats
  const totalSessions = sessions.filter(s => !s.isActive).length;
  
  const wins = sessions.filter(
    s => !s.isActive && s.cashOut !== undefined && s.cashOut > s.buyIn
  ).length;
  
  const losses = sessions.filter(
    s => !s.isActive && s.cashOut !== undefined && s.cashOut < s.buyIn
  ).length;
  
  // Properly calculate net profit by adding up profits and losses from all completed sessions
  const netProfit = sessions.reduce(
    (total, session) => {
      // Only calculate for completed sessions with valid cashOut values
      if (!session.isActive && session.cashOut !== undefined && !isNaN(session.cashOut) && 
          session.buyIn !== undefined && !isNaN(session.buyIn)) {
        // Ensure we're working with numbers
        const cashOutValue = Number(session.cashOut);
        const buyInValue = Number(session.buyIn);
        
        // Calculate profit/loss for this session
        return total + (cashOutValue - buyInValue);
      }
      return total;
    }, 0
  );
  
  // Format the profit amount with 2 decimal places and include dollar sign
  const formattedProfit = (netProfit !== undefined && !isNaN(netProfit)) ? netProfit.toFixed(2) : "0.00";
  const profitClass = netProfit >= 0 ? 'text-green-500' : 'text-poker-red';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="font-serif text-xl text-poker-black font-bold mb-4 text-center">Session Stats</h2>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Sessions</span>
          <span className="text-lg font-bold">{totalSessions}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Record</span>
          <span className="text-lg font-bold">{wins}W - {losses}L</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 text-sm">Net Profit</span>
          <span className={`text-lg font-bold ${profitClass}`}>
            ${formattedProfit}
          </span>
        </div>
      </div>
    </div>
  );
}
