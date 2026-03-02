import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aidict.app",
  appName: "AI Dict",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    preferredContentMode: "mobile",
    scheme: "capacitor",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    Browser: {
      windowName: "_blank",
    },
  },
};

export default config;
