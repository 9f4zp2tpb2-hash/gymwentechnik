// GymWenTechnik – Globale Einstellungen (klassisches Script, OHNE defer im <head> einbinden)
// Setzt Dark-Mode und Barrierefreiheit auf <html>, bevor die Seite gezeichnet wird (kein Aufblitzen).
(function () {
  'use strict';
  var root = document.documentElement;
  var theme = null, a11y = null;
  try { theme = localStorage.getItem('gwt_theme'); a11y = localStorage.getItem('gwt_a11y'); } catch (e) {}
  if (theme === 'dark') root.classList.add('dark');
  if (a11y === '1') root.classList.add('a11y');

  var st = document.createElement('style');
  st.textContent =
    'html.a11y body{font-size:1.1rem!important;line-height:1.9!important;}' +
    'html.a11y *{letter-spacing:.02em;}' +
    'html.a11y a:focus,html.a11y button:focus{outline:3px solid #1EAE95!important;outline-offset:3px;}';
  document.head.appendChild(st);

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.createElement('button');
    btn.id = 'a11yToggleBtn';
    btn.type = 'button';
    btn.title = 'Barrierefreiheits-Modus';
    btn.setAttribute('aria-label', 'Barrierefreiheits-Modus umschalten');
    btn.setAttribute('aria-pressed', root.classList.contains('a11y') ? 'true' : 'false');
    btn.style.cssText = 'position:fixed;bottom:1.2rem;left:1.2rem;z-index:998;background:#0B0B0E;border:1px solid #6b6b72;color:#F5F3EE;font-size:1rem;width:40px;height:40px;cursor:pointer;border-radius:50%;';
    btn.textContent = '♿';
    function paint(on) { btn.style.borderColor = on ? '#1EAE95' : '#6b6b72'; btn.style.color = on ? '#1EAE95' : '#F5F3EE'; }
    paint(root.classList.contains('a11y'));
    btn.addEventListener('click', function () {
      var on = root.classList.toggle('a11y');
      try { localStorage.setItem('gwt_a11y', on ? '1' : '0'); } catch (e) {}
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      paint(on);
    });
    document.body.appendChild(btn);
  });
})();
