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

  return {
    isPremium,
    checkPremiumFeature,
    user
  };
};

export default usePremiumAccess;