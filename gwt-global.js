// GymWenTechnik – Globale Website-Funktionen
// Saisonale Themes, Barrierefreiheit, Dark/Light-Mode-Persistenz

(function() {
  'use strict';

  // Dark/Light-Mode beim Laden sofort anwenden (vor FOUC)
  var theme = localStorage.getItem('gwt_theme');
  if (theme === 'light') document.body && document.body.classList.add('light');

  // Barrierefreiheits-Modus persistieren
  var a11y = localStorage.getItem('gwt_a11y');
  if (a11y === '1') document.documentElement.classList.add('a11y');

  // CSS für Barrierefreiheit
  var a11yStyle = document.createElement('style');
  a11yStyle.textContent =
    'html.a11y body { font-size: 1.1rem !important; line-height: 1.9 !important; }' +
    'html.a11y * { letter-spacing: 0.02em; }' +
    'html.a11y a, html.a11y button { outline: 2px solid transparent; }' +
    'html.a11y a:focus, html.a11y button:focus { outline: 2px solid #1EAE95 !important; outline-offset: 3px; }' +
    'html.a11y .hero-title { font-size: clamp(3rem, 8vw, 7rem) !important; }';
  document.head.appendChild(a11yStyle);

  // Barrierefreiheits-Button in die Seite injizieren
  document.addEventListener('DOMContentLoaded', function() {
    // Body light-mode auch nach DOMContentLoaded anwenden
    if (localStorage.getItem('gwt_theme') === 'light') {
      document.body.classList.add('light');
    }

    var btn = document.createElement('button');
    btn.id = 'a11yToggleBtn';
    btn.title = 'Barrierefreiheits-Modus';
    btn.setAttribute('aria-label', 'Barrierefreiheits-Modus umschalten');
    btn.style.cssText = 'position:fixed;bottom:1.2rem;left:1.2rem;z-index:998;background:rgba(30,30,40,0.9);border:1px solid #3a3a4a;color:#8888a0;font-size:1rem;width:38px;height:38px;cursor:pointer;border-radius:50%;transition:all 0.2s;backdrop-filter:blur(8px)';
    btn.innerHTML = '♿';
    btn.addEventListener('click', function() {
      var active = document.documentElement.classList.toggle('a11y');
      localStorage.setItem('gwt_a11y', active ? '1' : '0');
      btn.style.borderColor = active ? '#1EAE95' : '#3a3a4a';
      btn.style.color = active ? '#1EAE95' : '#8888a0';
    });
    if (document.documentElement.classList.contains('a11y')) {
      btn.style.borderColor = '#1EAE95';
      btn.style.color = '#1EAE95';
    }
    document.body.appendChild(btn);
  });

})();
