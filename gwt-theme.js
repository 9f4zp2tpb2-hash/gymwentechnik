// GymWenTechnik – Saisonale Themes
// Lädt globale Settings aus Firestore und wendet das aktive Theme an.
// Admin kann Theme + Zeitraum im internen Bereich unter Einstellungen konfigurieren.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FB_CONFIG = {
  apiKey: "AIzaSyDQpvKRIGh55OHYeqtcZ7Hzz4qcie_KAXU",
  authDomain: "gwt-database.firebaseapp.com",
  projectId: "gwt-database",
  storageBucket: "gwt-database.firebasestorage.app",
  messagingSenderId: "410076918223",
  appId: "1:410076918223:web:3c7bb9a2084fdc83b9a2ba"
};

const THEMES = {
  christmas: {
    '--accent': '#c0392b',
    '--accent2': '#27ae60',
    banner: '🎄 Frohe Weihnachten von der GymWenTechnik! 🎄',
    bg: 'rgba(192,57,43,0.05)'
  },
  halloween: {
    '--accent': '#e67e22',
    '--accent2': '#8e44ad',
    banner: '🎃 Happy Halloween! 🎃',
    bg: 'rgba(230,126,34,0.05)'
  },
  easter: {
    '--accent': '#27ae60',
    '--accent2': '#f39c12',
    banner: '🐣 Frohe Ostern von der GymWenTechnik! 🐣',
    bg: 'rgba(39,174,96,0.05)'
  },
  summer: {
    '--accent': '#f39c12',
    '--accent2': '#2980b9',
    banner: '☀️ Schönen Sommer wünscht die GymWenTechnik! ☀️',
    bg: 'rgba(243,156,18,0.05)'
  }
};

function dateInRange(from, to) {
  if (!from || !to) return false;
  const parts1 = from.split('.');
  const parts2 = to.split('.');
  if (parts1.length < 2 || parts2.length < 2) return false;
  const fd = parseInt(parts1[0]), fm = parseInt(parts1[1]);
  const td = parseInt(parts2[0]), tm = parseInt(parts2[1]);
  if (!fd || !fm || !td || !tm) return false;
  const now = new Date();
  const cur = (now.getMonth()) * 100 + now.getDate();
  const start = (fm - 1) * 100 + fd;
  const end = (tm - 1) * 100 + td;
  if (start <= end) return cur >= start && cur <= end;
  return cur >= start || cur <= end; // Jahreswechsel-übergreifend (z.B. Advent)
}

try {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(FB_CONFIG, 'theme-app-' + Math.random().toString(36).slice(2));
  const db = getFirestore(app);
  const snap = await getDoc(doc(db, 'settings', 'global'));
  if (snap.exists()) {
    const { seasonalTheme, themeFrom, themeTo } = snap.data();
    if (seasonalTheme && seasonalTheme !== 'none' && THEMES[seasonalTheme]) {
      if (dateInRange(themeFrom, themeTo)) {
        const t = THEMES[seasonalTheme];
        // CSS-Variablen überschreiben
        const s = document.createElement('style');
        s.id = 'gwt-seasonal-theme';
        s.textContent = ':root {' +
          Object.entries(t)
            .filter(([k]) => k.startsWith('--'))
            .map(([k, v]) => k + ':' + v + ' !important')
            .join(';') +
          '}';
        document.head.appendChild(s);
        // Saisonaler Banner-Streifen oben
        if (t.banner && !document.getElementById('seasonBanner')) {
          const banner = document.createElement('div');
          banner.id = 'seasonBanner';
          banner.style.cssText =
            'text-align:center;padding:0.45rem 1rem;font-size:0.82rem;' +
            'background:' + t.bg + ';border-bottom:1px solid var(--border);' +
            'letter-spacing:0.1em;position:relative;z-index:99;';
          banner.textContent = t.banner;
          document.body.prepend(banner);
          // Nav nach unten verschieben damit Banner nicht überlappt
          const nav = document.querySelector('nav');
          if (nav) nav.style.top = banner.offsetHeight + 'px';
        }
      }
    }
  }
} catch(e) {
  // Themes sind optional – Fehler nicht anzeigen, Seite läuft normal weiter
}
