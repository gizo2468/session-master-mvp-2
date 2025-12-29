import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const SUPABASE_FUNCTION_URL =
  "https://wfmvvpbpuqbzidptxbqx.supabase.co/functions/v1/send-test-push";

let pushInitialized = false;

async function postToSupabase(payload: Record<string, unknown>) {
  const res = await fetch(SUPABASE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log("[PUSH] Supabase response status:", res.status);
  console.log("[PUSH] Supabase response body:", text);
}

async function initPushOnce() {
  if (pushInitialized) return;
  pushInitialized = true;

  if (!Capacitor.isNativePlatform()) {
    console.log("[PUSH] Not native platform, skipping.");
    return;
  }

  console.log("[PUSH] Init starting...");

  // הכי חשוב: להסיר listeners ישנים כדי שלא יהיה כפול
  await PushNotifications.removeAllListeners();

  PushNotifications.addListener("registration", async (token) => {
    console.log("[PUSH] Push token:", token.value);

    // שולחים ל-Supabase כדי לבצע send-test-push / רישום / בדיקה (לפי מה שהפונקציה שלך עושה)
    await postToSupabase({
      token: token.value,
      platform: "ios",
    });
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

createRoot(document.getElementById("root")!).render(<App />);

// ריצה פעם אחת אחרי שהאפליקציה עלתה
setTimeout(() => {
  void initPushOnce();
}, 300);