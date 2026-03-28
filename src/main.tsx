import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { registerPushToken } from "./services/pushTokenService";

let pushInitialized = false;

async function initPushOnce() {
  if (pushInitialized) return;
  pushInitialized = true;

  if (!Capacitor.isNativePlatform()) {
    console.log("[PUSH] Not native platform, skipping.");
    return;
  }

  console.log("[PUSH] Init starting...");

  // Remove old listeners to prevent duplicates
  await PushNotifications.removeAllListeners();

  PushNotifications.addListener("registration", async (token) => {
    console.log("[PUSH] Push token received:", token.value);

    // Save to push_tokens table (handles auth timing automatically)
    await registerPushToken(token.value, "ios");
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.log("[PUSH] registrationError:", err);
  });

  const perm = await PushNotifications.checkPermissions();
  console.log("[PUSH] checkPermissions:", perm);

  if (perm.receive !== "granted") {
    const req = await PushNotifications.requestPermissions();
    console.log("[PUSH] requestPermissions:", req);

    if (req.receive !== "granted") {
      console.log("[PUSH] User denied push permission");
      return;
    }
  }

  console.log("[PUSH] Registering with APNS...");
  await PushNotifications.register();
}

createRoot(document.getElementById("root")!).render(<ThemeProvider><App /></ThemeProvider>);

// ריצה פעם אחת אחרי שהאפליקציה עלתה
setTimeout(() => {
  void initPushOnce();
}, 300);