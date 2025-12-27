
import React from 'react';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';

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
      <div className="mt-3 pt-3 border-t border-border">
        <div className="h-6 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="bg-muted px-3 py-2 rounded-md">
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center">
            <div className="font-medium text-xs text-foreground">Tables</div>
            <div className="text-muted-foreground font-semibold">{tables}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-xs text-foreground">Hands</div>
            <div className="text-muted-foreground font-semibold">{hands}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-xs text-foreground">Buy-ins</div>
            <div className="text-muted-foreground font-semibold">{currencySymbol}{totalBuyIns.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-xs text-foreground">Payout</div>
            <div className="text-muted-foreground font-semibold">{currencySymbol}{totalPayout.toFixed(0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionStatsDisplay;
