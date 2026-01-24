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
      maxStudentsForCoach: 3,  // Free coaches can connect to max 3 players
      maxCoachesForStudent: 1  // Free students can connect to max 1 coach
    };
  };

  // Notes limits for free users
  const getNotesLimits = () => {
    if (isPremium) {
      return { maxNotes: Infinity };
    }
    return { maxNotes: 10 };  // Free users: 10 notes max
  };

  return {
    isPremium,
    checkPremiumFeature,
    getConnectionLimits,
    getNotesLimits,
    user
  };
};

export default usePremiumAccess;