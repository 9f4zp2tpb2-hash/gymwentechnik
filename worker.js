// GymWenTechnik – Cloudflare Worker (kostenlos, ohne Firebase-Blaze-Tarif)
// Push (Cron, alle 15 Min.): neue/geänderte Veranstaltungen und neue News → Mitteilung an alle Geräte im Topic "team"
// Benötigt ein Secret namens SERVICE_ACCOUNT (JSON-Schlüssel des Firebase-Dienstkontos), siehe DEPLOY.md.

const PROJECT = 'gwt-database';
const SITE = 'https://gymwentechnik.de';
const TOPIC = 'team';
const FS = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents';
const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

/* ---------- Firestore (REST) ---------- */
function dec(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
  return null;
}
const fieldsOf = d => Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, dec(v)]));
const idOf = d => decodeURIComponent(d.name.split('/').pop());

async function listAll(col, token) {
  const out = []; let page = '';
  do {
    const url = FS + '/' + col + '?pageSize=300' + (page ? '&pageToken=' + encodeURIComponent(page) : '');
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) throw new Error('Firestore ' + col + ' ' + r.status);
    const j = await r.json();
    out.push(...(j.documents || [])); page = j.nextPageToken || '';
  } while (page);
  return out;
}

/* ---------- Datum ---------- */
function parseDmy(s) {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(s || '').trim());
  return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : null;
}
function dateLabel(ev) {
  if (ev.dateMode === 'soon') return 'Bald';
  const s = parseDmy(ev.startDate); if (!s) return ev.startDate || '';
  const f = d => d.getUTCDate() + '. ' + MONATE[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  if (ev.dateMode === 'range') { const e = parseDmy(ev.endDate); if (e) return f(s) + ' – ' + f(e); }
  return f(s);
}

/* ---------- Google-Anmeldung mit Dienstkonto ---------- */
async function accessToken(env) {
  const sa = JSON.parse(env.SERVICE_ACCOUNT), now = Math.floor(Date.now() / 1000);
  const b64u = x => btoa(typeof x === 'string' ? x : String.fromCharCode(...new Uint8Array(x))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const unsigned = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64u(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + unsigned + '.' + b64u(sig) });
  if (!r.ok) throw new Error('Token ' + r.status + ' ' + await r.text());
  return (await r.json()).access_token;
}

/* ---------- Push ---------- */
async function loadState(tok) {
  const r = await fetch(FS + '/push_state/sig', { headers: { Authorization: 'Bearer ' + tok } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('State ' + r.status);
  return JSON.parse(dec((await r.json()).fields.data) || '{}');
}
async function saveState(tok, map) {
  const r = await fetch(FS + '/push_state/sig', { method: 'PATCH', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(map) } } }) });
  if (!r.ok) throw new Error('State save ' + r.status);
}
async function sendTopic(tok, title, body, path) {
  const link = SITE + path;
  const r = await fetch('https://fcm.googleapis.com/v1/projects/' + PROJECT + '/messages:send', { method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { topic: TOPIC, notification: { title, body }, data: { url: link },
      webpush: { fcm_options: { link }, notification: { icon: SITE + '/icon-192.png' } } } }) });
  if (!r.ok) console.log('FCM Fehler', r.status, await r.text());
}
// Alle registrierten Geräte dem Topic zuordnen (idempotent); ungültige Tokens löschen
async function syncTopic(tok) {
  const docs = await listAll('push_tokens', tok), tokens = docs.map(idOf);
  for (let i = 0; i < tokens.length; i += 1000) {
    const chunk = tokens.slice(i, i + 1000);
    const r = await fetch('https://iid.googleapis.com/iid/v1:batchAdd', { method: 'POST',
      headers: { Authorization: 'Bearer ' + tok, 'access_token_auth': 'true', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '/topics/' + TOPIC, registration_tokens: chunk }) });
    if (!r.ok) { console.log('batchAdd Fehler', r.status, await r.text()); continue; }
    const res = (await r.json()).results || [];
    await Promise.all(res.map((x, idx) => x && x.error && /NOT_FOUND|INVALID_ARGUMENT/.test(x.error)
      ? fetch(FS + '/push_tokens/' + encodeURIComponent(chunk[idx]), { method: 'DELETE', headers: { Authorization: 'Bearer ' + tok } }) : null));
  }
  return tokens.length;
}

export async function checkAndPush(env) {
  const tok = await accessToken(env);
  const [events, news] = await Promise.all([listAll('events', tok), listAll('news', tok)]);
  const cur = {}, evById = {}, nwById = {};
  events.forEach(d => { const f = fieldsOf(d), id = idOf(d); evById[id] = f; cur['e:' + id] = [f.name, f.startDate, f.endDate, f.dateMode].join('|'); });
  news.forEach(d => { const id = idOf(d); nwById[id] = fieldsOf(d); cur['n:' + id] = '1'; });
  const prev = await loadState(tok);
  if (!prev) { await saveState(tok, cur); console.log('Erster Lauf: Stand gespeichert, keine Mitteilungen.'); return; }

  const jobs = [];
  Object.keys(evById).forEach(id => {
    const ev = evById[id], k = 'e:' + id, probe = ev.category === 'probe';
    const path = probe ? '/gwtorgatool.html#/events' : '/veranstaltung.html?id=' + id;
    if (!(k in prev)) jobs.push([(probe ? 'Neue Probe: ' : ev.category === 'buehne' ? 'Neue Bühnenbelegung: ' : 'Neue Veranstaltung: ') + (ev.name || ''), dateLabel(ev), path]);
    else if (prev[k] !== cur[k]) jobs.push(['Geändert: ' + (ev.name || ''), dateLabel(ev), path]);
  });
  Object.keys(nwById).forEach(id => { if (!(('n:' + id) in prev)) jobs.push(['Neue News: ' + (nwById[id].title || ''), String(nwById[id].body || '').slice(0, 120), '/news.html']); });

  if (jobs.length) {
    await syncTopic(tok);
    if (jobs.length > 5) await sendTopic(tok, jobs.length + ' Neuigkeiten bei der GymWenTechnik', 'Schau im Tool vorbei.', '/gwtorgatool.html');
    else for (const j of jobs) await sendTopic(tok, ...j);
  }
  await saveState(tok, cur);
  console.log('Lauf fertig, Mitteilungen:', jobs.length);
}

export default {
  async fetch() { return new Response('GymWenTechnik Push-Worker läuft.', { status: 200 }); },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkAndPush(env).catch(e => console.log('Push-Lauf fehlgeschlagen:', e && e.message || e)));
  }
};
