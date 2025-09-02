import React from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { CURRENCIES } from '@/hooks/useDefaultCurrency';
import PremiumFeatureGate from './PremiumFeatureGate';

interface CurrencyGateProps {
  children: React.ReactNode;
  selectedCurrency?: string;
}

const CurrencyGate: React.FC<CurrencyGateProps> = ({ children, selectedCurrency = 'USD' }) => {
  const { isPremium } = usePremiumAccess();
  
  // If premium user, show all currencies
  if (isPremium) {
    return <>{children}</>;
  }
  
  // If free user and selecting non-USD currency, show gate
  if (selectedCurrency !== 'USD') {
    return (
      <PremiumFeatureGate
        featureName="Multiple Currencies"
        description="Upgrade to Premium to track your sessions in multiple currencies beyond USD."
      >
        {children}
      </PremiumFeatureGate>
    );
  }
  
  // Free users can access USD, show filtered options
  return <>{children}</>;
};

export const getAvailableCurrencies = (isPremium: boolean) => {
  if (isPremium) {
    return CURRENCIES;
  }
  
  // Free users only get USD
  return CURRENCIES.filter(currency => currency.code === 'USD');
};

export default CurrencyGate;