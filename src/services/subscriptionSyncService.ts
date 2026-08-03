import { supabase } from '@/integrations/supabase/client';

/**
 * Sync premium status to Supabase via secure edge function.
 * Activation requires a valid Apple transaction receipt (verified server-side).
 * Deactivation does not need a receipt.
 */
export const syncPremiumStatus = async (
  isPremium: boolean,
  _expiryDate?: Date,
  _productId?: string,
  receiptData?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('sync-subscription', {
      body: {
        isPremium,
        receiptData: isPremium ? receiptData ?? null : null,
      },
    });

    if (error) {
      console.error('[SubscriptionSync] Edge function error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[SubscriptionSync] Sync failed:', error);
    return false;
  }
};

/**
 * Verify and sync subscription status on app launch.
 * Activation requires a valid Apple receipt — never trust local entitlement alone.
 */
export const verifyAndSyncSubscription = async (
  hasActiveEntitlement: boolean,
  currentIsPremium: boolean,
  expiryDate?: Date,
  productId?: string,
  receiptData?: string
): Promise<boolean> => {
  if (hasActiveEntitlement !== currentIsPremium) {
    return await syncPremiumStatus(hasActiveEntitlement, expiryDate, productId, receiptData);
  }
  return true;
};

