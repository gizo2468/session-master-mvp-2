import React, { useState } from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import PremiumBanner from './PremiumBanner';
import PremiumFeatureDialog from './PremiumFeatureDialog';

interface HandDetailGateProps {
  children: React.ReactNode;
}

const HandDetailGate: React.FC<HandDetailGateProps> = ({ children }) => {
  const { isPremium } = usePremiumAccess();
  const [showDialog, setShowDialog] = useState(false);
  
  if (isPremium) {
    return <>{children}</>;
  }
  
  return (
    <>
      <PremiumBanner onClick={() => setShowDialog(true)} />
      <PremiumFeatureDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
};

export default HandDetailGate;