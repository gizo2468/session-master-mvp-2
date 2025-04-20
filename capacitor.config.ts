
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fa19e82d191f494f933fbcc0a4a9f418',
  appName: 'session-master-mvp',
  webDir: 'dist',
  server: {
    url: 'https://fa19e82d-191f-494f-933f-bcc0a4a9f418.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB'
    }
  }
};

export default config;
