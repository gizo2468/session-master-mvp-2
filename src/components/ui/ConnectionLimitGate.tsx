import React from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import PremiumFeatureGate from './PremiumFeatureGate';

interface ConnectionLimitGateProps {
  children: React.ReactNode;
  currentConnections: number;
  userRole: 'coach' | 'student';
}

const ConnectionLimitGate: React.FC<ConnectionLimitGateProps> = ({ 
  children, 
  currentConnections, 
  userRole 
}) => {
  const { isPremium, getConnectionLimits } = usePremiumAccess();
  const limits = getConnectionLimits();
  
  const maxConnections = userRole === 'coach' 
    ? limits.maxStudentsForCoach 
    : limits.maxCoachesForStudent;
  
  // If premium user, no limits
  if (isPremium) {
    return <>{children}</>;
  }
  
  // If at or over limit, show gate
  if (currentConnections >= maxConnections) {
    const limitText = userRole === 'coach' 
      ? `Free coaches can connect with up to ${maxConnections} students`
      : `Free players can connect with up to ${maxConnections} coach`;
      
    return (
      <PremiumFeatureGate
        featureName="Unlimited Connections"
        description={`${limitText}. Upgrade to Premium for unlimited connections.`}
      >
        {children}
      </PremiumFeatureGate>
    );
  }
  
  // Within limits, show content
  return <>{children}</>;
};

export default ConnectionLimitGate;