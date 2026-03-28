

## Update Signup Email Confirmation Redirect — With 3 Pre-Checks

### Check 1: Production Supabase Redirect URLs

The `supabase/config.toml` has `auto_confirm_email = true` and does **not** include `https://sessionmaster.site/*` in `additional_redirect_urls`. However, `config.toml` only controls the **local dev** Supabase instance — it does **not** control the production Supabase project settings.

**Action required before implementation**: You must verify in the Supabase Dashboard (Authentication → URL Configuration) that `https://sessionmaster.site/*` is listed under "Redirect URLs". If it is not, add it manually:

→ https://supabase.com/dashboard/project/wfmvvpbpuqbzidptxbqx/auth/url-configuration

Without this, Supabase will reject the redirect to `sessionmaster.site/confirm-email`.

I will also update `config.toml` to keep it in sync for local dev.

### Check 2: auto_confirm_email = true

The config shows `auto_confirm_email = true`. If this is also the production setting, then new users are confirmed immediately upon signup — **no confirmation email is ever sent**, so the `emailRedirectTo` URL is never used for signup confirmation.

However, the code still has a "Resend Verification Email" flow in both `Signup.tsx` and `Login.tsx`, which suggests email confirmation was expected at some point. There are two possibilities:

- **If production has auto-confirm ON**: The redirect change is harmless but will only matter if auto-confirm is later disabled. The code change is still correct to make.
- **If production has auto-confirm OFF** (dashboard override): The redirect change is essential and will work as expected.

**Action**: Check Supabase Dashboard → Authentication → Providers → Email → "Confirm email" toggle to verify the production setting.

→ https://supabase.com/dashboard/project/wfmvvpbpuqbzidptxbqx/auth/providers

### Check 3: Website /confirm-email Page Handles Hash Params

I reviewed the website project's `ConfirmEmail.tsx`. It correctly handles:
- **Valid state**: Detects `access_token=` in URL hash or `type=signup` in hash/search params → shows success UI
- **Invalid/expired state**: No matching params → shows "Invalid or Expired Link" UI
- **Loading state**: Shows nothing while checking (`isValid === null`)

This is correct for Supabase's confirmation flow, which appends `#access_token=...&type=signup` to the redirect URL.

### Implementation (3 files in this project)

**1. `src/pages/auth/Signup.tsx`** — 2 changes:
- Line 211: `emailRedirectTo: '${window.location.origin}/'` → `'https://sessionmaster.site/confirm-email'`
- Line 281: Same change for resend flow

**2. `src/pages/auth/Login.tsx`** — 1 change:
- Line 100: Same change for resend flow

**3. `supabase/config.toml`** — 1 change:
- Line 5: Add `"https://sessionmaster.site/*"` to `additional_redirect_urls` array (keeps local dev config in sync)

### What stays unchanged
- Login, forgot password, reset password flows
- App UI, navigation, all other auth behavior
- No changes to the website project

