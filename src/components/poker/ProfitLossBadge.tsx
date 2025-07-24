
import React from 'react';
import Icon from '@/components/ui/Lucide';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';

interface ProfitLossBadgeProps {
  profit: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProfitLossBadge: React.FC<ProfitLossBadgeProps> = ({ 
  profit, 
  currency = 'USD',
  size = 'md', 
  className = '' 
}) => {
  const profitClass = profit >= 0 ? 'text-green-700' : 'text-red-700';
  const currencySymbol = getCurrencySymbol(currency);
  
  const sizeClasses = {
    sm: {
      container: 'px-3 py-1.5',
      icon: 14,
      text: 'text-sm'
    },
    md: {
      container: 'px-4 py-2',
      icon: 16,
      text: 'text-base'
    },
    lg: {
      container: 'px-5 py-2.5',
      icon: 18,
      text: 'text-lg'
    }
  };
  
  const currentSize = sizeClasses[size];
  
  return (
    <div className={`relative ${className}`}>
      {/* Enhanced spotlight effect background */}
      <div className={`absolute inset-0 rounded-full bg-gradient-radial ${profit >= 0 ? 'from-green-200/50 via-green-100/30 to-transparent shadow-lg shadow-green-300/60' : 'from-red-200/50 via-red-100/30 to-transparent shadow-lg shadow-red-300/60'} blur-sm scale-110`}></div>
      
      {/* Profit/loss badge */}
      <div className={`relative inline-flex items-center gap-2 ${currentSize.container} rounded-full shadow-md ${profit >= 0 ? 'bg-green-100/70 shadow-green-200/50' : 'bg-red-100/70 shadow-red-200/50'}`}>
        <Icon name="dollar-sign" size={currentSize.icon} className={profitClass} />
        <span className={`${currentSize.text} font-bold ${profitClass}`}>
          {profit >= 0 ? '+' : ''}{currencySymbol}{Math.abs(profit).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ProfitLossBadge;
