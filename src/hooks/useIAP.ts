import { useState, useEffect, useCallback } from 'react';
import { 
  initializeIAP, 
  getProducts, 
  getLocalizedPrice as getIAPLocalizedPrice,
  purchaseProduct as iapPurchase,
  restorePurchases as iapRestore,
  checkActiveEntitlement,
  PRODUCT_IDS,
  type PurchaseResult,
  type EntitlementResult
} from '@/services/iapService';
import { syncPremiumStatus } from '@/services/subscriptionSyncService';
import { detectPlatform } from '@/utils/platformDetection';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const useIAP = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUserProfile } = useAuth();
  const platform = detectPlatform();
  const isIOS = platform === 'ios';

  // Initialize IAP on mount (iOS only)
  useEffect(() => {
    if (isIOS) {
      initializeIAP().then(success => {
        setIsInitialized(success);
      });
    }
  }, [isIOS]);

  /**
   * Get localized price for a plan, falling back to default
   */
  const getLocalizedPrice = useCallback((planType: 'monthly' | 'yearly', fallbackPrice: number): string => {
    if (!isIOS || !isInitialized) {
      return `$${fallbackPrice.toFixed(2)}`;
    }
    
    const localizedPrice = getIAPLocalizedPrice(planType);
    return localizedPrice || `$${fallbackPrice.toFixed(2)}`;
  }, [isIOS, isInitialized]);

  /**
   * Purchase a subscription
   */
  const purchase = useCallback(async (planType: 'monthly' | 'yearly'): Promise<boolean> => {
    if (!isIOS) {
      toast.error('In-app purchases are only available on iOS');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const productId = PRODUCT_IDS[planType];
      const result = await iapPurchase(productId);

      if (result.success) {
        // Sync to Supabase
        await syncPremiumStatus(true, result.expiryDate, productId);
        
        // Refresh user profile to update premium status in app
        await refreshUserProfile();
        
        return true;
      } else if (result.error === 'USER_CANCELLED') {
        // User cancelled - no error message needed
        return false;
      } else {
        setError(result.error || 'Purchase failed');
        toast.error(result.error || 'Purchase failed. Please try again.');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Purchase failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isIOS, refreshUserProfile]);

  /**
   * Restore previous purchases
   */
  const restore = useCallback(async (): Promise<boolean> => {
    if (!isIOS) {
      toast.error('Restore purchases is only available on iOS');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await iapRestore();

      if (result.hasActiveSubscription) {
        // Sync to Supabase
        await syncPremiumStatus(true, result.expiryDate, result.productId);
        
        // Refresh user profile
        await refreshUserProfile();
        
        return true;
      } else {
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to restore purchases';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isIOS, refreshUserProfile]);

  /**
   * Check current entitlement status
   */
  const checkEntitlement = useCallback(async (): Promise<EntitlementResult> => {
    if (!isIOS) {
      return { hasActiveSubscription: false };
    }

    try {
      return await checkActiveEntitlement();
    } catch (err) {
      console.error('[useIAP] Entitlement check failed:', err);
      return { hasActiveSubscription: false };
    }
  }, [isIOS]);

  return {
    isInitialized,
    isLoading,
    error,
    isIOS,
    getLocalizedPrice,
    purchase,
    restore,
    checkEntitlement,
    PRODUCT_IDS
  };
};
