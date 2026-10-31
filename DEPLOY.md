# Einrichtung der GymWenTechnik-Website

## 1. Dateien hochladen (alle ins Hauptverzeichnis, außer worker/ und DEPLOY.md)
Seiten: index, ueber, veranstaltungen, veranstaltung (neu), galerie, kontakt, news, suche, gwtchat, impressum, datenschutz, intern, gwtorgatool
Gemeinsam: gwt-shared.css, gwt-shared.js, gwt-global.js, gwt-config.js (neu), firebase-messaging-sw.js (neu), manifest.webmanifest (neu), icon-192.png, icon-512.png (neu)
Außerdem: robots.txt, sitemap.xml
`gwt-theme.js` bleibt unverändert, so wie du ihn schon hast.
`firebase-messaging-sw.js` MUSS direkt im Hauptverzeichnis liegen.

## 2. Firestore-Regeln
`firestore.rules` in der Firebase Console (Firestore → Regeln) einfügen und veröffentlichen.
Neu: Collection `push_tokens` (Geräte für Push).

## 3. Push-Mitteilungen (optional, kostenlos, ohne Blaze-Tarif)
Ohne diesen Schritt läuft die gesamte Website normal. Nur die Push-Karte im Tool zeigt dann „noch nicht eingerichtet“.

### 3a. Web-Push-Schlüssel
Firebase Console → Projekteinstellungen → Cloud Messaging → **Web-Push-Zertifikate** → „Schlüsselpaar generieren“.
Den Schlüssel in `gwt-config.js` bei `vapidKey` eintragen und die Datei hochladen.

### 3b. Dienstkonto-Schlüssel
1. Firebase Console → Projekteinstellungen → **Dienstkonten** → „Neuen privaten Schlüssel generieren“ (lädt eine .json-Datei herunter).
2. Prüfen, dass die „Firebase Cloud Messaging API“ aktiv ist (Google Cloud Console → APIs & Dienste → Aktivierte APIs).
3. Die Datei ist wie ein Passwort: nur in Schritt 3c einfügen, danach löschen.
   (Ist das Erzeugen gesperrt, hat eine Organisationsrichtlinie es verboten. Dann muss ein Admin des Google-Cloud-Projekts es erlauben.)

### 3c. Cloudflare Worker (kostenlos, ohne Kreditkarte)
1. Konto auf cloudflare.com erstellen.
2. Workers & Pages → **Create** → **Create Worker** → Name z. B. `gwt-push` → Deploy → **Edit code**.
3. Den gesamten Inhalt von `worker/worker.js` einfügen → Deploy.
4. Settings → **Variables and Secrets** → Add → Typ **Secret**, Name `SERVICE_ACCOUNT`, Wert = kompletter Inhalt der .json-Datei.
5. Settings → **Trigger Events** → **Cron Triggers** → Add → `*/15 * * * *`.

### 3d. Einschalten
Jedes Mitglied aktiviert Push im Tool unter **Mein Konto → Push-Mitteilungen** (pro Gerät).
iPhone/iPad: erst über Safari „Teilen → Zum Home-Bildschirm“ installieren (iOS 16.4 oder neuer), sonst gibt es kein Push.

### So funktioniert es
- Der Worker prüft alle 15 Minuten Firestore. Neue Veranstaltungen/Proben/News und geänderte Namen oder Daten lösen eine Mitteilung aus.
  Der erste Lauf merkt sich nur den Stand und sendet nichts.
- Mitteilungen kommen deshalb bis zu etwa 15 Minuten nach der Änderung. Neu eingeschaltete Geräte werden beim nächsten Lauf angemeldet.
- Mehr als 5 Änderungen auf einmal werden zu einer Mitteilung zusammengefasst.
- Proben sind nicht öffentlich; Push dazu geht nur an Mitglieder.

### Grenzen der kostenlosen Tarife
- Cloudflare Workers: 100.000 Aufrufe pro Tag, der Cron braucht 96.
- Firestore Spark: 50.000 Lesezugriffe pro Tag. Jeder Lauf liest alle Veranstaltungen und News
  (z. B. 150 Dokumente × 96 Läufe ≈ 14.000 pro Tag). Bei sehr vielen Einträgen das Intervall auf `*/30` stellen.
- Firebase Cloud Messaging ist kostenlos.

## 4. Testen
- Alle Seiten aufrufen (Menü, Dark/Light-Umschalter, Links).
- Kontaktformular absenden → Vorgangsnummer (V + 6 Ziffern) → im gwtChat anmelden.
- Im Tool einloggen, Registrierung testen (Konto bleibt „pending“, bis ein Admin es freischaltet).
- Website-Editor: Seite wählen, Text anklicken, ändern, speichern.
- Im Tool eine Veranstaltung anlegen → Karte erscheint auf Startseite und unter Veranstaltungen; `veranstaltung.html?id=…` öffnen.

## Hinweise
- Die Detailseiten der Veranstaltungen stehen nicht in der `sitemap.xml`, weil sie dynamisch sind. Google findet sie über die Links der Veranstaltungsseite.
- Aus dem alten `intern.html` fehlen im neuen Tool noch der wöchentliche Freischalt-Code und die automatische Abmeldung bei Inaktivität.
- `contact_messages` ist laut Firestore-Regeln für alle les- und änderbar (bekannte Einschränkung).
