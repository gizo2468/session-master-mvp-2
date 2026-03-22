

## Fix: IAP Product Loading & Purchase Resilience

### Root Cause
The product IDs in code **already match** App Store Connect exactly:
- `sessionmaster.premium.monthly` ✓
- `com.sessionmaster.premium_yearly` ✓

The error `Cannot find product for id sessionmaster.premium.monthly` comes from the native `@capgo/native-purchases` plugin when StoreKit can't locate the product at purchase time. This happens when `loadProducts()` silently fails or returns empty, and `purchaseProduct()` proceeds anyway without verifying the product was loaded.

### Fix in `src/services/iapService.ts`

1. **Before purchasing, verify product exists in cache** — if not, retry `loadProducts()` once
2. **Add detailed logging** to `loadProducts()` so you can see in Xcode console exactly what products StoreKit returns (or why it returns empty)
3. **Show a clearer error message** when the product genuinely can't be found after retry, suggesting the user check their App Store Connect configuration

### Changes (single file)

**`src/services/iapService.ts`** — `purchaseProduct` function (line 105-134):
- Before calling `NativePurchases.purchaseProduct`, check if `productId` exists in `cachedProducts`
- If not found, call `await loadProducts()` to retry
- If still not found after retry, return a descriptive error: `"Product not found. Please ensure your subscription products are approved in App Store Connect and try again."`
- Add `console.log` showing requested vs available product IDs for debugging

Also in `loadProducts()` (line 65-86):
- Log the raw product identifiers requested and received for easier TestFlight debugging

### Important Note
If products still aren't found after this fix, the issue is on the **App Store Connect side** — common causes:
- Products not in "Ready to Submit" status
- Paid Apps Agreement not signed/active
- Bundle ID mismatch between Xcode project and App Store Connect
- Products created less than ~1 hour ago (propagation delay)

