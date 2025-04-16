
import { useSessionContext } from '@/context/SessionContext';

export default function StatsQuickView() {
  const { sessions } = useSessionContext();
  
  // Calculate stats
  const totalSessions = sessions.filter(s => !s.isActive).length;
  
  // Calculate wins based on total profit across all tables
  const wins = sessions.filter(
    s => !s.isActive && s.tables.reduce((total, table) => (
      table.cashOut ? total + (table.cashOut - table.buyIn) : total
    ), 0) > 0
  ).length;
  
  // Calculate losses based on total profit across all tables
  const losses = sessions.filter(
    s => !s.isActive && s.tables.reduce((total, table) => (
      table.cashOut ? total + (table.cashOut - table.buyIn) : total
    ), 0) < 0
  ).length;
  
  // Calculate net profit
  const netProfit = sessions.reduce(
    (total, session) => {
      if (!session.isActive) {
        const sessionProfit = session.tables.reduce((tableTotal, table) => {
          if (table.cashOut) {
            return tableTotal + (table.cashOut - table.buyIn);
          }
          return tableTotal;
        }, 0);
        return total + sessionProfit;
      }
      return total;
    }, 0
  );
  
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
            ${netProfit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
