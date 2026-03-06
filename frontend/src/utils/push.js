/**
 * Convert a base64url VAPID public key to a Uint8Array
 * (required by PushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

/**
 * Register the service worker, request notification permission,
 * subscribe to push, and save the subscription on the server.
 * Safe to call multiple times — skips if already subscribed.
 * Uses plain fetch so errors never trigger the axios toast interceptor.
 */
export async function registerPush() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // 1. Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    // 2. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // 3. Get VAPID public key from server (plain fetch — no toast on error)
    const keyRes = await fetch(`${BASE_URL}/push/vapid-public-key`);
    if (!keyRes.ok) return;
    const { publicKey } = await keyRes.json();
    if (!publicKey) return;
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 4. Subscribe (or reuse existing subscription)
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 5. Save subscription on server
    const { endpoint, keys } = subscription.toJSON();
    await fetch(`${BASE_URL}/push/subscribe`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ endpoint, keys }),
    });
  } catch (err) {
    // Non-fatal — notifications are optional
    console.warn("Push registration failed:", err.message);
  }
}

/**
 * Unsubscribe from push notifications and remove from server.
 */
export async function unregisterPush() {
  try {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    const { endpoint } = subscription.toJSON();
    await subscription.unsubscribe();
    await fetch(`${BASE_URL}/push/unsubscribe`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ endpoint }),
    });
  } catch (err) {
    console.warn("Push unregister failed:", err.message);
  }
}
