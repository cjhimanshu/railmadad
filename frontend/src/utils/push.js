import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

/**
 * Build the service worker URL with Firebase config embedded as query params.
 * The SW cannot access import.meta.env, so we pass config via query string.
 */
function buildSwUrl() {
  const cfg = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "",
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "",
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "",
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "",
  };
  const qs = Object.entries(cfg)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `/sw.js?${qs}`;
}

/**
 * Register the Firebase Messaging service worker, request notification
 * permission, obtain an FCM registration token, and save it on the server.
 * Safe to call multiple times.
 */
export async function registerPush() {
  try {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // 2. Register SW with Firebase config in query string
    const registration = await navigator.serviceWorker.register(buildSwUrl(), {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    // 3. Get FCM registration token
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return;

    // 4. Save token on server
    await fetch(`${BASE_URL}/push/subscribe`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    // Non-fatal — notifications are optional
    console.warn("Push registration failed:", err.message);
  }
}

/**
 * Remove FCM token from the server and unregister the service worker.
 */
export async function unregisterPush() {
  try {
    if (!("serviceWorker" in navigator)) return;
    await fetch(`${BASE_URL}/push/unsubscribe`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
  } catch (err) {
    console.warn("Push unregister failed:", err.message);
  }
}

/**
 * Listen for foreground (app-is-open) FCM messages.
 * Returns the unsubscribe function from onMessage.
 *
 * @param {(payload: object) => void} callback
 */
export function setupForegroundMessages(callback) {
  return onMessage(messaging, callback);
}
