// Wisp service worker
//
// This file is what makes background notifications actually work. The app
// was already calling navigator.serviceWorker.register('./sw.js') and
// swRegistration.showNotification(...), but sw.js didn't exist anywhere —
// so registration failed (404), swRegistration stayed null forever, and
// every notification silently fell back to the page-level `new
// Notification()` constructor, which a lot of browsers (notably iOS Safari
// in PWA/installed mode, and Android Chrome when the tab isn't the active
// one) simply refuse to fire. That's the main reason notifications looked
// like they "weren't working."
//
// Note on scope: this still can't wake the app when it's fully closed and
// there's no push subscription — that needs real Web Push + a backend
// endpoint, which this app doesn't have. What this DOES fix is
// notifications firing reliably while the app/tab is open in the
// background or minimized, and clicking a notification correctly
// reopening/focusing the right chat.

const CACHE_NAME = 'wisp-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Click handling: focus an existing Wisp tab if one is open and tell it
// which chat to jump to; otherwise open a new tab. Matches the
// 'notification-click' message the main page already listens for.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const chatId = event.notification.data && event.notification.data.chatId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (chatId) client.postMessage({ type: 'notification-click', chatId });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    })
  );
});
