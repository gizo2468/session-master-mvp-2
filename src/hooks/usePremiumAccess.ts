import { useAuth } from '@/context/AuthContext';

export const usePremiumAccess = () => {
  const { user } = useAuth();
  
  const isPremium = Boolean(user?.isPremium);
  
  const checkPremiumFeature = (featureName: string): boolean => {
    if (!isPremium) {
      console.log(`Premium feature "${featureName}" requires subscription`);
      return false;
    }
    return true;
  };

  // Connection limits for free users
  const getConnectionLimits = () => {
    if (isPremium) {
      return { maxStudentsForCoach: Infinity, maxCoachesForStudent: Infinity };
    }
    
    return { 
      maxStudentsForCoach: 5,  // Free coaches can connect to max 5 students
      maxCoachesForStudent: 1  // Free students can connect to max 1 coach
    };
  };

  return {
    isPremium,
    checkPremiumFeature,
    getConnectionLimits,
    user
  };
};

export default usePremiumAccess;