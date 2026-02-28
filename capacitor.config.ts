import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aidict.app",
  appName: "AI Dict",
  webDir: "out",
  server: {
    androidScheme: "https", // Use https origin so LLM APIs accept CORS
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#6366f1",
    },
  },
};

export default config;
