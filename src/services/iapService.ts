import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { detectPlatform } from '@/utils/platformDetection';

// Product IDs as provided
export const PRODUCT_IDS = {
  monthly: 'sessionmaster.premium.monthly',
  yearly: 'com.sessionmaster.premium_yearly',
} as const;

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  expiryDate?: Date;
  error?: string; // 'USER_CANCELLED' | message
}

export interface EntitlementResult {
  hasActiveSubscription: boolean;
  productId?: string;
  expiryDate?: Date;
}

let isInitialized = false;
let cachedProducts: any[] = [];

const isIOS = () => detectPlatform() === 'ios';

const parseDate = (value?: string | number | null): Date | undefined => {
  if (!value) return undefined;
  const d = new Date(value as any);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/**
 * Initialize IAP - call once on app start
 */
export const initializeIAP = async (): Promise<boolean> => {
  if (!isIOS()) {
    console.log('[IAP] Not iOS, skipping initialization');
    return false;
  }
  if (isInitialized) return true;

  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      console.warn('[IAP] Billing not supported on this device');
      return false;
    }

    isInitialized = true;
    console.log('[IAP] Initialized (native-purchases)');

    await loadProducts();
    return true;
  } catch (error) {
    console.error('[IAP] Initialization failed:', error);
    return false;
  }
};

/**
 * Load products from App Store
 */
export const loadProducts = async (): Promise<any[]> => {
  if (!isIOS()) return [];

  const requestedIds = Object.values(PRODUCT_IDS);
  console.log('[IAP] Requesting products:', requestedIds);

  try {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: requestedIds,
      productType: PURCHASE_TYPE.SUBS,
    });

    cachedProducts = products || [];
    console.log(
      '[IAP] StoreKit returned',
      cachedProducts.length,
      'products:',
      cachedProducts.map((p: any) => ({
        id: p.productIdentifier || p.identifier,
        price: p.priceString || p.price,
      }))
    );

    if (cachedProducts.length === 0) {
      console.warn('[IAP] No products returned. Check: App Store Connect status, Paid Apps Agreement, Bundle ID match.');
    }

    return cachedProducts;
  } catch (error) {
    console.error('[IAP] Failed to load products:', error);
    cachedProducts = [];
    return [];
  }
};

/**
 * Get cached products
 */
export const getProducts = (): any[] => cachedProducts;

/**
 * Get localized price for a plan
 */
export const getLocalizedPrice = (planType: 'monthly' | 'yearly'): string | null => {
  const productId = PRODUCT_IDS[planType];
  const p = cachedProducts.find((x: any) => (x.productIdentifier || x.identifier) === productId);
  return p?.priceString || null;
};

/**
 * Purchase a subscription
 */
export const purchaseProduct = async (productId: string): Promise<PurchaseResult> => {
  if (!isIOS()) return { success: false, error: 'IAP only available on iOS' };

  try {
    await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.SUBS,
      quantity: 1,
    });

    // Verify entitlement after purchase
    const ent = await checkActiveEntitlement();
    return {
      success: ent.hasActiveSubscription,
      productId: ent.productId || productId,
      expiryDate: ent.expiryDate,
      error: ent.hasActiveSubscription ? undefined : 'Purchase completed but entitlement not active',
    };
  } catch (error: any) {
    const msg = String(error?.message || error || '');
    if (
      msg.toLowerCase().includes('cancel') ||
      error?.code === 'USER_CANCELLED' ||
      error?.code === 1
    ) {
      return { success: false, error: 'USER_CANCELLED' };
    }
    console.error('[IAP] Purchase failed:', error);
    return { success: false, error: msg || 'Purchase failed' };
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async (): Promise<EntitlementResult> => {
  if (!isIOS()) return { hasActiveSubscription: false };

  await NativePurchases.restorePurchases();
  return await checkActiveEntitlement();
};

/**
 * Check active subscription status
 */
export const checkActiveEntitlement = async (): Promise<EntitlementResult> => {
  if (!isIOS()) return { hasActiveSubscription: false };

  try {
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.SUBS,
    });

    const relevant = (purchases || []).filter((p: any) =>
      Object.values(PRODUCT_IDS).includes(p.productIdentifier)
    );

    const active = relevant.filter((p: any) => p.isActive);

    if (!active.length) return { hasActiveSubscription: false };

    active.sort((a: any, b: any) => {
      const da = parseDate(a.expirationDate)?.getTime() ?? 0;
      const db = parseDate(b.expirationDate)?.getTime() ?? 0;
      return db - da;
    });

    const best = active[0];
    return {
      hasActiveSubscription: true,
      productId: best.productIdentifier,
      expiryDate: parseDate(best.expirationDate),
    };
  } catch (error) {
    console.error('[IAP] Entitlement check failed:', error);
    return { hasActiveSubscription: false };
  }
};
