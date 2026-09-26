# The summit register backend

The summit register (Wave 3, W3-09) is a guestbook that appears once a visitor reaches the summit. GitHub Pages can only serve static files, so the signatures live in a tiny free backend. Pick **one** of the two below, then paste its URL into `index.html`:

```html
<div class="reg" id="reg" hidden data-endpoint="PASTE-THE-URL-HERE">
```

Until `data-endpoint` is set, the register stays hidden on the live site. Locally (`localhost`, `file://`) or with `?register` in the URL it runs as a preview that saves only to your own browser, so you can see and test it.

Both backends accept the same thing and answer the same way:

- `GET ?limit=30` → `{ ok, entries: [{ ts, name, from, note }], count }`, newest first
- `POST` a JSON body sent as `text/plain` (so browsers skip the CORS preflight): `{ name, from, note, website, t }` → `{ ok, entry, count }` or `{ ok: false, error }`
- Limits: name and from up to 40 characters, the note up to 120, no links. `website` is a hidden honeypot field and `t` is how long the form was open; anything sent in under 2.5 seconds is refused.

## Option A: Google Sheet + Apps Script (easiest, moderate in the Sheet)

1. Create a Google Sheet, then **Extensions → Apps Script**. Replace the code with `register-apps-script.gs` and save.
2. Pick `setup` in the function menu and **Run** it once. Allow access. It creates the `Register` tab with a `show` checkbox column.
3. **Deploy → New deployment → Web app**. Execute as **Me**, who has access **Anyone**. Deploy and copy the URL ending in `/exec`.
4. Paste that URL into `data-endpoint` and push.

To hide a signature, untick `show` (or delete the row). Lists are cached for 60 seconds. To approve every signature yourself, set `AUTO_APPROVE = false`; new rows then wait until you tick `show`. After editing the script, deploy a new version (**Deploy → Manage deployments → Edit → New version**) or the old code keeps running.

## Option B: Cloudflare Worker + KV (fastest, per-visitor rate limit)

1. `npm create cloudflare@latest register` and choose the Hello World Worker. Replace `src/index.js` with `register-worker.js`.
2. `npx wrangler kv namespace create REGISTER` and add the binding it prints to `wrangler.toml`.
3. Optional: `npx wrangler secret put ADMIN_TOKEN` so you can hide entries, and a `SALT` var for hashing IPs.
4. `npx wrangler deploy`, then paste the `workers.dev` URL into `data-endpoint`.

It only answers pages on `https://aravin4d.github.io` (set `ALLOW_ORIGIN` to change that) and allows one signature per visitor per minute. To hide an entry:

```sh
curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" "https://register.<you>.workers.dev/?id=ENTRY_ID"
```

The entry ids come back in the `GET` response.
