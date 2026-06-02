// Service worker de Firebase Cloud Messaging (notificaciones en segundo plano).
// La config es pública (igual que NEXT_PUBLIC_*), por eso se puede escribir aquí:
// los service workers no tienen acceso a variables de entorno.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAcyyfPBdYmmLm0MiHl0XbO1xnDg2_jvoY',
  authDomain: 'excercisetracker-76d0a.firebaseapp.com',
  projectId: 'excercisetracker-76d0a',
  storageBucket: 'excercisetracker-76d0a.firebasestorage.app',
  messagingSenderId: '1064500284846',
  appId: '1:1064500284846:web:f7c51baa3e467bc3330c3f',
});

const messaging = firebase.messaging();

// Cuando llega una notificación y la app NO está en primer plano.
messaging.onBackgroundMessage((payload) => {
  const titulo = payload.notification?.title || '¡Hora de moverte! 💪';
  const opciones = {
    body: payload.notification?.body || 'Mantén viva tu racha. Marca tu entrenamiento de hoy.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.fcmOptions?.link || payload.data?.url || '/today' },
  };
  self.registration.showNotification(titulo, opciones);
});

// Al tocar la notificación: abre la app (o enfoca la pestaña existente).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/today';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.includes(url) && 'focus' in win) return win.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
