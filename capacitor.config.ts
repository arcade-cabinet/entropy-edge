import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.arcadecabinet.entropyedge",
  appName: "Entropy Edge",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#07080a",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#07080a",
      overlaysWebView: true,
    },
  },
};

export default config;
