import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "site.leizhangphy.workbench",
  appName: "认知工作台",
  webDir: "dist",
  server: {
    // 开发时用本地服务器，构建 App 时清除此配置
    // url: "http://192.168.x.x:5173",
    // cleartext: true,
  },
  ios: {
    scheme: "CognitiveWorkbench",
    // 允许后台计时（番茄钟）
    contentInset: "always",
  },
  android: {
    // 允许 WebView 后台运行计时器
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#f8f8f7",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#f8f8f7",
    },
    LocalNotifications: {
      smallIcon: "ic_stat_workbench",
      iconColor: "#748965",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
