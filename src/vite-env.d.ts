
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_AUTH_EMAIL_OTP_EXPIRY: string;
  readonly VITE_ENABLE_LEAKED_PASSWORD_PROTECTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
