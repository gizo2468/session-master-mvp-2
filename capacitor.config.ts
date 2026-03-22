
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.guyzohar.sessionmaster',
  appName: 'session-master-mvp',
  webDir: 'dist',

  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB'
    },
    iconPath: 'public/lovable-uploads/f2365416-2998-43f2-a84a-393da76f67d4.png' 
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    swipeBackEnabled: true
  }
};

export default config;
