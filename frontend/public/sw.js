// RailMadad Service Worker — handles Web Push notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "RailMadad", body: event.data.text() };
  }

  const options = {
    body: payload.body || "",
    icon: payload.icon || "/train-icon.svg",
    badge: payload.badge || "/train-icon.svg",
    data: { url: payload.url || "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "RailMadad", options),
  );
});

// Open / focus the relevant page when notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If app is already open, focus it and navigate
        for (const client of windowClients) {
          if ("focus" in client) {
            client.focus();
            client.navigate && client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});
