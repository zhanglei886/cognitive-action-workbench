// ============================================================
// 原生通知系统（Capacitor Local Notifications）
// 浏览器环境下静默降级，不报错
// ============================================================

import { LocalNotifications, ScheduleOptions, LocalNotificationSchema } from "@capacitor/local-notifications";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

// ============================================================
// 平台检测
// ============================================================

let isNative = false;

export async function initNativeBridge() {
  try {
    // 检测是否在 Capacitor 原生环境中运行
    const info = await CapacitorApp.getInfo();
    isNative = true;
    console.log(`[Native] Running on ${info.name} ${info.version}`);

    // 请求通知权限
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display === "granted") {
      console.log("[Native] Notification permission granted");
    }
  } catch {
    // 浏览器环境，静默降级
    isNative = false;
  }
}

export function isNativePlatform() {
  return isNative;
}

// ============================================================
// 番茄钟通知
// ============================================================

export async function scheduleTimerEndNotification(modeMinutes: number) {
  if (!isNative) return; // 浏览器不需要通知

  // 番茄钟结束后立即通知
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: "计时结束",
          body: `${modeMinutes} 分钟专注完成，来做个简短复盘吧。`,
          schedule: { at: new Date(Date.now() + 1000) },
          sound: "beep.wav",
          smallIcon: "ic_stat_workbench",
          extra: { type: "timer-end" },
        } as LocalNotificationSchema,
      ],
    });

    // 触觉反馈
    await Haptics.notification({ type: NotificationType.Success });
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.warn("[Native] Timer notification failed:", error);
  }
}

// ============================================================
// 每日复盘提醒
// ============================================================

export async function scheduleReviewReminder() {
  if (!isNative) return;

  try {
    // 取消旧提醒
    await LocalNotifications.cancel({ notifications: [{ id: 100 }] });

    // 每晚 21:00 提醒
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 100,
          title: "今日复盘",
          body: "今天做成了什么？有什么情绪？明天怎么微调？",
          schedule: {
            on: {
              hour: 21,
              minute: 0,
            },
            allowWhileIdle: true,
          },
          extra: { type: "review-reminder" },
        } as LocalNotificationSchema,
      ],
    });
  } catch (error) {
    console.warn("[Native] Review reminder failed:", error);
  }
}

// ============================================================
// 想法冷却到期提醒
// ============================================================

export async function scheduleCoolingCompleteNotification(thoughtTitle: string, availableAt: Date) {
  if (!isNative) return;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 200 + Math.floor(Math.random() * 1000),
          title: "想法冷却完成",
          body: `「${thoughtTitle.slice(0, 40)}」可以处理了。`,
          schedule: { at: availableAt },
          extra: { type: "cooling-complete" },
        } as LocalNotificationSchema,
      ],
    });
  } catch (error) {
    console.warn("[Native] Cooling notification failed:", error);
  }
}

// ============================================================
// 通知管理
// ============================================================

export async function cancelAllNotifications() {
  if (!isNative) return;
  try {
    await LocalNotifications.cancel({ notifications: [] }); // 清空所有
  } catch {
    // ignore
  }
}

export async function getPendingNotifications() {
  if (!isNative) return [];
  try {
    const result = await LocalNotifications.getPending();
    return result.notifications;
  } catch {
    return [];
  }
}

// ============================================================
// 推送通知（Phase 3 启用）
// ============================================================

let pushToken: string | null = null;

export async function registerPushNotifications() {
  if (!isNative) return null;
  // 在 Phase 3 集成 RevenueCat/FCM 后启用
  // const { PushNotifications } = await import("@capacitor/push-notifications");
  // ...
  return pushToken;
}

export function getPushToken() {
  return pushToken;
}

// ============================================================
// 状态栏
// ============================================================

export async function setStatusBarStyle(dark: boolean) {
  if (!isNative) return;
  try {
    if (dark) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#10120f" });
    } else {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#f8f8f7" });
    }
  } catch {
    // ignore
  }
}

// ============================================================
// Android 返回键
// ============================================================

export function setupBackButton(onBack: () => void) {
  if (!isNative) return;
  try {
    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        onBack(); // 回到首页，不退出 App
      }
    });
  } catch {
    // ignore
  }
}
