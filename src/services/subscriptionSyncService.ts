import { supabase } from '@/integrations/supabase/client';

/**
 * Sync premium status to Supabase via secure edge function
 */
export const syncPremiumStatus = async (
  isPremium: boolean,
  expiryDate?: Date,
  productId?: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-subscription', {
      body: {
        isPremium,
        expiryDate: expiryDate?.toISOString() || null,
        productId: productId || null,
      },
    });

    if (error) {
      console.error('[SubscriptionSync] Edge function error:', error);
      return false;
    }

    console.log('[SubscriptionSync] Premium status synced:', isPremium);
    return true;
  } catch (error) {
    console.error('[SubscriptionSync] Sync failed:', error);
    return false;
  }
};

/**
 * Verify and sync subscription status on app launch
 */
export const verifyAndSyncSubscription = async (
  hasActiveEntitlement: boolean,
  currentIsPremium: boolean,
  expiryDate?: Date,
  productId?: string
): Promise<boolean> => {
  // Only sync if there's a mismatch
  if (hasActiveEntitlement !== currentIsPremium) {
    console.log('[SubscriptionSync] Status mismatch detected, syncing...', {
      hasActiveEntitlement,
      currentIsPremium
    });
    return await syncPremiumStatus(hasActiveEntitlement, expiryDate, productId);
  }
  
  return true;
};
