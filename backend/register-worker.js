/* Summit register backend: a Cloudflare Worker with a KV namespace. Free tier is plenty.
 *
 * Setup (full notes in README.md):
 *   npm create cloudflare@latest register   (choose "Hello World" Worker), replace src/index.js with this file
 *   npx wrangler kv namespace create REGISTER   → add the binding it prints to wrangler.toml
 *   optional: npx wrangler secret put ADMIN_TOKEN   (lets you hide entries)
 *   npx wrangler deploy   → copy the workers.dev URL into data-endpoint on <div id="reg"> in index.html
 *
 * Vars: ALLOW_ORIGIN (default https://aravin4d.github.io), SALT (any string, for hashing IPs).
 * Hide an entry: curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" "https://…/?id=ENTRY_ID"
 */
const LIMIT = 30, MAX = { name: 40, from: 40, note: 120 }, MIN_MS = 2500;

export default {
  async fetch(req, env){
    const cors = { 'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || 'https://aravin4d.github.io', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Vary': 'Origin' };
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url), KV = env.REGISTER;

    if (req.method === 'GET'){
      const lim = Math.min(LIMIT, Math.max(1, parseInt(url.searchParams.get('limit') || LIMIT, 10) || LIMIT));
      const list = await KV.list({ prefix: 'e:', limit: Math.min(1000, lim * 2) }), entries = [];
      for (const k of list.keys){
        if (entries.length >= lim) break;
        const v = await KV.get(k.name, 'json');
        if (v && !v.hidden) entries.push({ id: k.name.slice(2), ts: v.ts, name: v.name, from: v.from, note: v.note });
      }
      return json({ ok: true, entries, count: parseInt(await KV.get('count') || '0', 10) });
    }

    if (req.method === 'POST'){
      let b; try { b = JSON.parse(await req.text()); } catch (e){ return json({ ok: false, error: 'bad_json' }, 400); }
      if (b.website) return json({ ok: true, entry: null });
      if (!(Number(b.t) >= MIN_MS)) return json({ ok: false, error: 'too_fast' }, 400);
      const name = clean(b.name, MAX.name), from = clean(b.from, MAX.from), note = clean(b.note, MAX.note);
      if (!name) return json({ ok: false, error: 'name' }, 400);
      if (/(https?:|www\.|\.[a-z]{2,}\/)/i.test(`${name} ${from} ${note}`)) return json({ ok: false, error: 'links' }, 400);
      const rk = 'rl:' + await hash((req.headers.get('CF-Connecting-IP') || 'unknown') + (env.SALT || 'summit'));
      if (await KV.get(rk)) return json({ ok: false, error: 'rate' }, 429);
      await KV.put(rk, '1', { expirationTtl: 60 });
      const ts = new Date().toISOString(), id = String(9e15 - Date.now()).padStart(16, '0') + Math.random().toString(36).slice(2, 6), entry = { ts, name, from, note };
      await KV.put('e:' + id, JSON.stringify(entry));   // reverse timestamps: KV lists keys in order, so the newest come first
      const count = parseInt(await KV.get('count') || '0', 10) + 1; await KV.put('count', String(count));
      return json({ ok: true, entry: { id, ...entry }, count });
    }

    if (req.method === 'DELETE'){
      if (!env.ADMIN_TOKEN || req.headers.get('Authorization') !== 'Bearer ' + env.ADMIN_TOKEN) return json({ ok: false, error: 'auth' }, 401);
      const id = url.searchParams.get('id'); if (!id) return json({ ok: false, error: 'id' }, 400);
      const v = await KV.get('e:' + id, 'json'); if (!v) return json({ ok: false, error: 'missing' }, 404);
      if (!v.hidden){ v.hidden = true; await KV.put('e:' + id, JSON.stringify(v)); const c = Math.max(0, parseInt(await KV.get('count') || '1', 10) - 1); await KV.put('count', String(c)); }
      return json({ ok: true });
    }
    return json({ ok: false, error: 'method' }, 405);
  }
};

function clean(s, n){ return String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
async function hash(s){ const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(d)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join(''); }
