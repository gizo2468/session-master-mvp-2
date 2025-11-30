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
  
  // Free currency codes
  const freeCurrencies = ['USD', 'EUR'];
  
  // If free user and selecting a premium currency, show gate
  if (!freeCurrencies.includes(selectedCurrency)) {
    return (
      <PremiumFeatureGate
        featureName="Multiple Currencies"
        description="Upgrade to Premium to track your sessions in multiple currencies beyond USD and EUR."
      >
        {children}
      </PremiumFeatureGate>
    );
  }
  
  // Free users can access USD and EUR, show filtered options
  return <>{children}</>;
};

export const getAvailableCurrencies = (isPremium: boolean) => {
  if (isPremium) {
    return CURRENCIES;
  }
  
  // Free users get USD and EUR
  return CURRENCIES.filter(currency => ['USD', 'EUR'].includes(currency.code));
};

export default CurrencyGate;