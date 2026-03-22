
## Investigate IAP Product Loading Failure on TestFlight

### What I found in the code
The app is requesting these exact subscription IDs in code:
- `sessionmaster.premium.monthly`
- `com.sessionmaster.premium_yearly`

They appear consistently in:
- `src/services/iapService.ts`
- `src/pages/Subscription.tsx`

So this is not a typo mismatch in the JavaScript layer.

### Most likely exact reason
The iOS app bundle identifier in the native project is currently:

`app.lovable.fa19e82d191f494f933fbcc0a4a9f418`

That is the bundle ID being built into TestFlight, as shown in:
- `ios/App/app.xcodeproj/project.pbxproj`
- `capacitor.config.ts`

If your App Store Connect subscriptions were created under a different app/bundle ID, StoreKit will return no products for this TestFlight build even when the product IDs themselves are correct.

That matches the current behavior exactly:
- app requests correct IDs
- StoreKit returns no matching products
- cached products stay empty
- purchase popup never opens
- app shows “Product not found...”

### Why I believe this is the root cause
The failure is happening before purchase, at product lookup time.
Given the code:
1. Products are requested with the right IDs
2. The service retries loading once
3. It still finds no products
4. Therefore the returned StoreKit products array is effectively empty for this build

The strongest repo-level mismatch is the app identity itself:
- TestFlight app bundle ID: `app.lovable.fa19e82d191f494f933fbcc0a4a9f418`
- Subscription naming suggests they may belong to a different App Store Connect app/project

### Plan to fix
1. Verify which App Store Connect app owns these subscriptions
   - Confirm its bundle ID exactly

2. Align the native iOS bundle ID with that App Store Connect app
   - Update `capacitor.config.ts` app ID
   - Update `ios/App/app.xcodeproj/project.pbxproj` bundle identifier

3. Keep the subscription product IDs unchanged
   - Monthly: `sessionmaster.premium.monthly`
   - Yearly: `com.sessionmaster.premium_yearly`

4. Add one more explicit diagnostic log in the IAP init flow
   - Log requested product IDs
   - Log returned product IDs
   - Log returned count
   - Log active bundle identifier from native side for confirmation

5. Rebuild and upload a new TestFlight build
   - Then retest monthly and yearly purchase buttons

### Expected result after fix
If the bundle ID matches the App Store Connect app that owns those subscriptions:
- StoreKit should return both products
- monthly and yearly buttons should resolve real products
- Apple’s native purchase sheet should open

### Files to update
- `capacitor.config.ts`
- `ios/App/app.xcodeproj/project.pbxproj`
- possibly `ios/App/App/Info.plist` only if needed for consistency
- optionally `src/services/iapService.ts` for one extra diagnostic log

### Technical notes
- I cannot see the actual TestFlight/Xcode device logs from this environment, so I cannot quote the exact runtime log line.
- But from the codebase, I can verify the requested product IDs are correct.
- The strongest concrete mismatch visible in the repo is the native bundle identifier, and that is the most likely reason StoreKit is returning zero products.
- On iOS, correct product IDs are not enough; the binary must belong to the same App Store Connect app that owns those subscriptions.

### Implementation focus
Only fix the subscription connection:
- do not change subscription UI
- do not change pricing logic
- do not change unrelated navigation or premium gating
