// GymWenTechnik – gemeinsame Bausteine (ES-Modul)
// Baut Navigation, Menü, Footer, Cursor, Theme-Toggle, Reveal und CMS-Loader auf.
// Seiten setzen <body data-page="seitenname"> und laden dieses Modul.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FB_CONFIG = {
  apiKey: "AIzaSyDQpvKRIGh55OHYeqtcZ7Hzz4qcie_KAXU",
  authDomain: "gwt-database.firebaseapp.com",
  projectId: "gwt-database",
  storageBucket: "gwt-database.firebasestorage.app",
  messagingSenderId: "410076918223",
  appId: "1:410076918223:web:3c7bb9a2084fdc83b9a2ba"
};
const app = getApps()[0] || initializeApp(FB_CONFIG);
export const db = getFirestore(app);

const BASE = 'https://gymwentechnik.de/';
const PAGES = [['ueber','Über uns'],['veranstaltungen','Veranstaltungen'],['news','News'],['galerie','Galerie'],['kontakt','Kontakt'],['gwtorgatool','Intern']];

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ===== Gerüst einfügen ===== */
const cur = document.body.dataset.page || '';
const menuItems = PAGES.map(([id, label], i) =>
  '<li><a href="' + BASE + id + '.html"' + (id === cur ? ' aria-current="page"' : '') + '><span class="num">0' + (i + 1) + '</span>' + label + '</a></li>').join('');

document.body.insertAdjacentHTML('afterbegin',
  '<div id="scrollBar"></div><div id="cursorDot"></div><div id="cursorRing"></div>' +
  '<nav class="gwt-nav" aria-label="Hauptnavigation">' +
    '<a href="' + BASE + '" class="nav-logo"><span class="dot"></span>GymWenTechnik</a>' +
    '<div class="nav-actions">' +
      '<button type="button" class="theme-toggle" id="themeToggleBtn" aria-label="Zwischen hellem und dunklem Design wechseln"></button>' +
      '<button type="button" class="nav-toggle" id="menuBtn" aria-expanded="false" aria-controls="menuOverlay">Menü<span class="bars" id="menuBars"><span></span><span></span></span></button>' +
    '</div>' +
  '</nav>' +
  '<div id="menuOverlay" role="dialog" aria-modal="true" aria-label="Menü">' +
    '<button type="button" class="menu-close" id="menuCloseBtn" aria-label="Menü schließen">✕</button>' +
    '<ul class="menu-list">' + menuItems + '</ul>' +
    '<div class="menu-foot"><span>Gymnasium Wendelstein</span><a href="' + BASE + 'suche.html">Suche</a></div>' +
  '</div>');

document.body.insertAdjacentHTML('beforeend',
  '<footer class="gwt-footer">' +
    '<div class="footer-top">' +
      '<div class="footer-brand" data-cms-key="footer.brand">Let’s<br>talk.</div>' +
      '<div class="footer-links">' +
        '<div class="footer-col"><div class="footer-col-title">Seiten</div>' +
          '<a href="' + BASE + 'ueber.html">Über uns</a><a href="' + BASE + 'veranstaltungen.html">Veranstaltungen</a><a href="' + BASE + 'news.html">News</a><a href="' + BASE + 'galerie.html">Galerie</a></div>' +
        '<div class="footer-col"><div class="footer-col-title">Mehr</div>' +
          '<a href="' + BASE + 'kontakt.html">Kontakt</a><a href="' + BASE + 'suche.html">Suche</a><a href="' + BASE + 'gwtorgatool.html">Intern</a></div>' +
      '</div>' +
    '</div>' +
    '<div class="footer-bottom"><span>© 2026 Bühnentechnik Gymnasium Wendelstein</span>' +
      '<span><a href="' + BASE + 'impressum.html">Impressum</a><a href="' + BASE + 'datenschutz.html">Datenschutz</a></span></div>' +
  '</footer>');

/* ===== Theme-Toggle ===== */
const root = document.documentElement;
const themeBtn = document.getElementById('themeToggleBtn');
function paintTheme() {
  const dark = root.classList.contains('dark');
  themeBtn.textContent = dark ? '☀' : '☾';
  themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
}
paintTheme();
themeBtn.addEventListener('click', () => {
  const dark = root.classList.toggle('dark');
  try { localStorage.setItem('gwt_theme', dark ? 'dark' : 'light'); } catch (e) {}
  paintTheme();
});

/* ===== Menü ===== */
const overlay = document.getElementById('menuOverlay');
const menuBtn = document.getElementById('menuBtn');
const menuBars = document.getElementById('menuBars');
function toggleMenu(open) {
  overlay.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  menuBars.style.transform = open ? 'rotate(45deg)' : '';
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) document.getElementById('menuCloseBtn').focus(); else menuBtn.focus();
}
menuBtn.addEventListener('click', () => toggleMenu(!overlay.classList.contains('open')));
document.getElementById('menuCloseBtn').addEventListener('click', () => toggleMenu(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) toggleMenu(false); });

/* ===== Cursor + Scrollbalken ===== */
if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  document.body.classList.add('has-cursor');
  const dot = document.getElementById('cursorDot'), ring = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; });
  (function loop() { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); })();
  document.addEventListener('mouseover', e => ring.classList.toggle('hover', !!e.target.closest('a,button')));
}
const bar = document.getElementById('scrollBar');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + '%';
}, { passive: true });

/* ===== Reveal ===== */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); } });
}, { threshold: .12 });
export function observeReveal(scope) { (scope || document).querySelectorAll('.reveal:not(.visible)').forEach(el => revObs.observe(el)); }
observeReveal();

/* ===== CMS ===== */
// Sicherheitsnetz: CMS-Texte dürfen Formatierung enthalten, aber keine Skripte, Event-Handler oder javascript:-Links
export function sanitizeHtml(html) {
  const t = document.createElement('template'); t.innerHTML = html;
  t.content.querySelectorAll('script,object,embed,link,meta,base,iframe,style').forEach(n => n.remove());
  t.content.querySelectorAll('*').forEach(el => [...el.attributes].forEach(a => {
    const nm = a.name.toLowerCase();
    if (nm.startsWith('on') || (['href','src','action','formaction','xlink:href'].includes(nm) && /^\s*(javascript|vbscript|data:text\/html)/i.test(a.value))) el.removeAttribute(a.name);
  }));
  return t.innerHTML;
}
export async function loadCms(pageName) {
  const els = document.querySelectorAll('[data-cms-key]');
  if (!els.length) return;
  try {
    const snap = await getDoc(doc(db, 'cms_content', pageName));
    if (!snap.exists()) return;
    const data = snap.data();
    els.forEach(el => {
      const v = data[el.dataset.cmsKey];
      if (v !== undefined && v !== null && v !== '') el.innerHTML = sanitizeHtml(String(v));
    });
  } catch (e) { /* Standardtexte bleiben stehen */ }
}
if (cur) loadCms(cur);

// Editor-Vorschau (Website-Editor im Intern-Bereich): Klick auf Text meldet ihn an das Eltern-Fenster
if (new URLSearchParams(location.search).get('cmsEditPreview') === '1') {
  const s = document.createElement('style');
  s.textContent = '[data-cms-key]{outline:1px dashed rgba(30,174,149,.6);outline-offset:2px;cursor:pointer!important}[data-cms-key]:hover{outline:2px solid #1EAE95;background:rgba(30,174,149,.1)!important}';
  document.head.appendChild(s);
  document.querySelectorAll('[data-cms-key]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      window.parent.postMessage({ type: 'cmsEditClick', key: el.dataset.cmsKey, currentText: el.innerHTML }, '*');
    }, true);
  });
}

/* ===== Seitenbilder (data-img-slot) ===== */
export async function loadPageImages() {
  const slots = document.querySelectorAll('[data-img-slot]');
  if (!slots.length) return;
  try {
    const snap = await getDocs(collection(db, 'page_images'));
    const map = {};
    snap.docs.forEach(d => { map[d.id] = d.data(); });
    slots.forEach(el => {
      const d = map[el.dataset.imgSlot];
      if (d && /^https:\/\//i.test(d.url || '')) {
        const img = document.createElement('img');
        img.src = d.url; img.alt = d.alt || ''; img.loading = 'lazy';
        el.prepend(img);
        el.classList.add('has-img');
      }
    });
  } catch (e) { /* Slots bleiben ausgeblendet */ }
}
loadPageImages();
