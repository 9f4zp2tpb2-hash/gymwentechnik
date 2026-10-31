// Service Worker für Push-Mitteilungen (muss im Hauptverzeichnis der Website liegen)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: 'AIzaSyDQpvKRIGh55OHYeqtcZ7Hzz4qcie_KAXU',
  authDomain: 'gwt-database.firebaseapp.com',
  projectId: 'gwt-database',
  storageBucket: 'gwt-database.firebasestorage.app',
  messagingSenderId: '410076918223',
  appId: '1:410076918223:web:3c7bb9a2084fdc83b9a2ba'
});
// Mitteilungen mit "notification"-Block zeigt der Browser selbst an; Klick öffnet den Link aus fcmOptions.
firebase.messaging();
