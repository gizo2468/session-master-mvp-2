import { supabase } from '@/integrations/supabase/client';

/**
 * Sync premium status to Supabase after IAP purchase/restore
 */
export const syncPremiumStatus = async (
  isPremium: boolean,
  expiryDate?: Date,
  productId?: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[SubscriptionSync] No authenticated user');
      return false;
    }

    // Update profiles.is_premium
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_premium: isPremium,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('[SubscriptionSync] Failed to update profile:', profileError);
      return false;
    }

    // If activating premium, also track in user_subscriptions
    if (isPremium) {
      const planType = productId?.includes('yearly') ? 'ios_yearly' : 'ios_monthly';
      
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_type: planType,
          status: 'active',
          is_active: true,
          start_date: new Date().toISOString(),
          end_date: expiryDate?.toISOString() || null,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (subError) {
        // Log but don't fail - profiles update is more important
        console.warn('[SubscriptionSync] Failed to upsert subscription:', subError);
      }
    } else {
      // Deactivating - update existing subscription if any
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'expired',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (subError) {
        console.warn('[SubscriptionSync] Failed to update subscription status:', subError);
      }
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
