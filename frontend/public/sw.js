// RailMadad Service Worker — Firebase Cloud Messaging (background handler)
// Firebase config is injected via query params when the SW is registered.

importScripts(
  "https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js",
);

// Read config from URL search params (set by push.js → buildSwUrl())
const params = new URL(self.location.href).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

// Handle background / terminated messages sent by Firebase
messaging.onBackgroundMessage((payload) => {
  const notif = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(notif.title || "RailMadad", {
    body: notif.body || "",
    icon: notif.icon || "/train-icon.svg",
    badge: "/train-icon.svg",
    data: { url: notif.click_action || data.url || "/" },
    vibrate: [200, 100, 200],
  });
});

// Open / focus the relevant page when notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.focus();
            client.navigate && client.navigate(targetUrl);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      }),
  );
});
