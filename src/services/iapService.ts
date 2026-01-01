import { CapacitorPurchases, PACKAGE_TYPE, type Package, type CustomerInfo } from '@capgo/capacitor-purchases';
import { detectPlatform } from '@/utils/platformDetection';

// Product IDs as provided
export const PRODUCT_IDS = {
  monthly: 'sessionmaster.premium.monthly',
  yearly: 'com.sessionmaster.premium_yearly'
} as const;

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  expiryDate?: Date;
  error?: string;
}

export interface EntitlementResult {
  hasActiveSubscription: boolean;
  productId?: string;
  expiryDate?: Date;
}

let isInitialized = false;
let availablePackages: Package[] = [];

/**
 * Initialize the IAP plugin - call once on app start
 */
export const initializeIAP = async (): Promise<boolean> => {
  const platform = detectPlatform();
  
  if (platform !== 'ios') {
    console.log('[IAP] Not iOS, skipping initialization');
    return false;
  }

  if (isInitialized) {
    return true;
  }

  try {
    // For iOS, we use RevenueCat through this plugin
    // The plugin requires a RevenueCat API key
    // For now, we'll initialize with observer mode for direct StoreKit
    await CapacitorPurchases.setup({
      apiKey: 'appl_placeholder', // Required by plugin
      observerMode: true // Use direct StoreKit
    });
    
    isInitialized = true;
    console.log('[IAP] Initialized successfully');
    
    // Load products
    await loadProducts();
    
    return true;
  } catch (error) {
    console.error('[IAP] Initialization failed:', error);
    return false;
  }
};

/**
 * Load available products from the App Store
 */
export const loadProducts = async (): Promise<Package[]> => {
  try {
    const result = await CapacitorPurchases.getOfferings();
    const offerings = result.offerings;
    
    if (offerings.current?.availablePackages) {
      availablePackages = offerings.current.availablePackages;
      console.log('[IAP] Loaded packages:', availablePackages.map(p => p.identifier));
    }
    
    return availablePackages;
  } catch (error) {
    console.error('[IAP] Failed to load products:', error);
    return [];
  }
};

/**
 * Get available products with localized pricing
 */
export const getProducts = (): Package[] => {
  return availablePackages;
};

/**
 * Get localized price for a product
 */
export const getLocalizedPrice = (planType: 'monthly' | 'yearly'): string | null => {
  const productId = PRODUCT_IDS[planType];
  const pkg = availablePackages.find(p => 
    p.product?.identifier === productId || p.identifier === productId
  );
  return pkg?.product?.priceString || null;
};

/**
 * Purchase a subscription product
 */
export const purchaseProduct = async (productId: string): Promise<PurchaseResult> => {
  const platform = detectPlatform();
  
  if (platform !== 'ios') {
    return { success: false, error: 'IAP only available on iOS' };
  }

  try {
    // Find the package for this product
    const pkg = availablePackages.find(p => 
      p.product?.identifier === productId || p.identifier === productId
    );

    if (!pkg) {
      // If no package found, try using monthly/annual package types
      const isYearly = productId.includes('yearly');
      const fallbackPkg = availablePackages.find(p => 
        isYearly ? p.packageType === PACKAGE_TYPE.ANNUAL : p.packageType === PACKAGE_TYPE.MONTHLY
      );
      
      if (fallbackPkg) {
        const result = await CapacitorPurchases.purchasePackage({
          identifier: fallbackPkg.identifier,
          offeringIdentifier: fallbackPkg.offeringIdentifier
        });

        if (result.customerInfo) {
          const expiryDate = getExpiryFromCustomerInfo(result.customerInfo);
          return {
            success: true,
            productId,
            expiryDate
          };
        }
      }
      
      return { success: false, error: 'Product not found' };
    }

    // Purchase via package
    const result = await CapacitorPurchases.purchasePackage({
      identifier: pkg.identifier,
      offeringIdentifier: pkg.offeringIdentifier
    });

    if (result.customerInfo) {
      const expiryDate = getExpiryFromCustomerInfo(result.customerInfo);
      return {
        success: true,
        productId,
        expiryDate
      };
    }

    return { success: true, productId };
  } catch (error: any) {
    console.error('[IAP] Purchase failed:', error);
    
    // Check if user cancelled
    if (error.code === 'USER_CANCELLED' || 
        error.code === 1 ||
        error.message?.includes('cancelled') || 
        error.message?.includes('canceled')) {
      return { success: false, error: 'USER_CANCELLED' };
    }
    
    return { 
      success: false, 
      error: error.message || 'Purchase failed' 
    };
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async (): Promise<EntitlementResult> => {
  const platform = detectPlatform();
  
  if (platform !== 'ios') {
    return { hasActiveSubscription: false };
  }

  try {
    const result = await CapacitorPurchases.restorePurchases();
    
    if (result.customerInfo) {
      return checkEntitlementFromCustomerInfo(result.customerInfo);
    }
    
    return { hasActiveSubscription: false };
  } catch (error) {
    console.error('[IAP] Restore failed:', error);
    throw error;
  }
};

/**
 * Check if user has an active subscription entitlement
 */
export const checkActiveEntitlement = async (): Promise<EntitlementResult> => {
  const platform = detectPlatform();
  
  if (platform !== 'ios') {
    return { hasActiveSubscription: false };
  }

  try {
    const result = await CapacitorPurchases.getCustomerInfo();
    
    if (result.customerInfo) {
      return checkEntitlementFromCustomerInfo(result.customerInfo);
    }
    
    return { hasActiveSubscription: false };
  } catch (error) {
    console.error('[IAP] Entitlement check failed:', error);
    return { hasActiveSubscription: false };
  }
};

/**
 * Extract entitlement info from customer info
 */
const checkEntitlementFromCustomerInfo = (customerInfo: CustomerInfo): EntitlementResult => {
  // Check for active entitlements
  const activeEntitlements = customerInfo.entitlements?.active;
  
  if (activeEntitlements && Object.keys(activeEntitlements).length > 0) {
    const entitlement = Object.values(activeEntitlements)[0];
    return {
      hasActiveSubscription: true,
      productId: entitlement.productIdentifier,
      expiryDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : undefined
    };
  }

  // Check active subscriptions directly
  const activeSubscriptions = customerInfo.activeSubscriptions;
  if (activeSubscriptions && activeSubscriptions.length > 0) {
    return {
      hasActiveSubscription: true,
      productId: activeSubscriptions[0]
    };
  }

  return { hasActiveSubscription: false };
};

/**
 * Get expiry date from customer info
 */
const getExpiryFromCustomerInfo = (customerInfo: CustomerInfo): Date | undefined => {
  const activeEntitlements = customerInfo.entitlements?.active;
  
  if (activeEntitlements && Object.keys(activeEntitlements).length > 0) {
    const entitlement = Object.values(activeEntitlements)[0];
    if (entitlement.expirationDate) {
      return new Date(entitlement.expirationDate);
    }
  }
  
  // Try latestExpirationDate as fallback
  if (customerInfo.latestExpirationDate) {
    return new Date(customerInfo.latestExpirationDate);
  }
  
  return undefined;
};
