# The summit register backend

Once a visitor reaches the summit, they can write their name into the snow, the sand or the stars (it depends on the theme). Since Wave 4 the register is **private**: names go to you and nowhere else. The page never lists anyone's name, and neither backend hands names back out to the public. The only name a visitor sees is their own, remembered on their own device.

GitHub Pages can only serve static files, so the names land in a small free backend. Pick one of the two below. The site is already pointed at your Google Apps Script URL:

```html
<div class="reg" id="reg" hidden data-endpoint="https://script.google.com/macros/s/…/exec">
```

With `data-endpoint` empty, the register stays hidden on the live site. Locally (`localhost`, `file://`) or with `?register` in the URL it runs as a preview that sends nothing and only remembers your own name on your device. That preview is why a name could show on the page without reaching the Sheet.

Both backends accept the same request:

- `POST` a JSON body sent as `text/plain` (so browsers skip the CORS preflight): `{ name, from, note, website, t, theme, secrets, page }` → `{ ok: true }` or `{ ok: false, error }`.
- A plain `GET` answers `{ ok: true }` and nothing else.
- Limits: name and from up to 40 characters, the note up to 140, no links. `website` is a hidden field only bots fill in, and `t` is how long the form was open; anything sent in under 2.5 seconds is refused.

## Option A: Google Sheet + Apps Script (what the site uses now)

**Updating the deployment you already have (do this once for Wave 4):**

1. Open the Sheet, then **Extensions → Apps Script**. Replace all the code with `register-apps-script.gs` and save.
2. Pick `setup` in the function menu and press **Run**. It moves the **Register** tab to the front of the Sheet and writes the Sheet's link to the log.
3. Pick `testWrite` and press **Run**. A test row appears on the Register tab. Delete it once you've seen it.
4. **Deploy → Manage deployments**, click the pencil (**Edit**), set **Version** to **New version**, and press **Deploy**. Editing the existing deployment keeps the same `/exec` URL. Choosing "New deployment" instead gives you a new URL, which would then need to go into `index.html`.

Until step 4 is done, the old code keeps running, and the old code lists every name to anyone who opens the URL.

**Where the names go:** a tab called **Register**, not Sheet1. The columns are when, name, from, note, theme, secrets found and page.

**Setting it up from scratch:** create a Sheet, open **Extensions → Apps Script**, paste the file, run `setup`, then **Deploy → New deployment → Web app** with *Execute as: Me* and *Who has access: Anyone*. Copy the URL ending in `/exec` into `data-endpoint`.

**If a name doesn't arrive:**

- Look at the Register tab, not Sheet1.
- Make sure the deployment has *Who has access: Anyone*. Anything else sends visitors a Google sign-in page instead of your script.
- If the script was made at script.google.com rather than from the Sheet, paste the Sheet's ID into `SHEET_ID` at the top of the script.
- In the Apps Script editor, **Executions** lists every request and any error.

## Option B: Cloudflare Worker + KV

1. `npm create cloudflare@latest register` and choose the Hello World Worker. Replace `src/index.js` with `register-worker.js`.
2. `npx wrangler kv namespace create REGISTER` and add the binding it prints to `wrangler.toml`.
3. `npx wrangler secret put ADMIN_TOKEN`. You need it to read the names, since nothing is public. Optionally set a `SALT` var for hashing IPs.
4. `npx wrangler deploy`, then paste the `workers.dev` URL into `data-endpoint`.

It only answers pages on `https://aravin4d.github.io` (set `ALLOW_ORIGIN` to change that) and allows one name per visitor per minute. To read or hide names:

```sh
curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://register.<you>.workers.dev/?limit=100"
curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" "https://register.<you>.workers.dev/?id=ENTRY_ID"
```
