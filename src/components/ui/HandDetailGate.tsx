import React from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import PremiumFeatureGate from './PremiumFeatureGate';

interface HandDetailGateProps {
  children: React.ReactNode;
}

const HandDetailGate: React.FC<HandDetailGateProps> = ({ children }) => {
  const { isPremium } = usePremiumAccess();
  
  if (isPremium) {
    return <>{children}</>;
  }
  
  return (
    <PremiumFeatureGate
      featureName="Full Hand Analysis"
      description="Upgrade to Premium to record detailed street-by-street action (flop, turn, river) and complete hand histories."
    >
      {children}
    </PremiumFeatureGate>
  );
};

export default HandDetailGate;