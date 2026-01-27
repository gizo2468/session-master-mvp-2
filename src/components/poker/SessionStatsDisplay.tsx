
import React from 'react';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import PokerTableIcon from '@/components/icons/PokerTableIcon';
import PlayingCardsIcon from '@/components/icons/PlayingCardsIcon';

interface SessionStatsDisplayProps {
  tables: number;
  hands: number;
  totalBuyIns: number;
  totalPayout: number;
  currency?: string;
  loading?: boolean;
}

const SessionStatsDisplay: React.FC<SessionStatsDisplayProps> = ({
  tables,
  hands,
  totalBuyIns,
  totalPayout,
  currency = 'USD',
  loading = false
}) => {
  const currencySymbol = getCurrencySymbol(currency);
  console.log('SessionStatsDisplay props:', { tables, hands, totalBuyIns, totalPayout, currency, loading });

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // Determine payout color: green if > 0, red if = 0
  const payoutColorClass = totalPayout > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="bg-gray-50 px-3 py-2 rounded-md">
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center">
            <div className="font-medium text-xs text-poker-gold">Tables</div>
            <div className="text-gray-800 font-semibold flex items-center justify-center gap-1">
              {tables}
              <PokerTableIcon size={18} className="text-gray-600" />
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-xs text-poker-gold">Hands</div>
            <div className="text-gray-800 font-semibold flex items-center justify-center gap-1">
              {hands}
              <PlayingCardsIcon size={18} className="text-gray-600" />
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-xs text-poker-gold">Buy-ins</div>
            <div className="text-blue-800 font-semibold">{currencySymbol}{totalBuyIns.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-xs text-poker-gold">Payout</div>
            <div className={`${payoutColorClass} font-semibold`}>{currencySymbol}{totalPayout.toFixed(0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionStatsDisplay;
