import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Codexy',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    cleartext: true, // permite http://
    androidScheme: 'http', 
    hostname: '172.30.1.161',
  }
};

export default config;
