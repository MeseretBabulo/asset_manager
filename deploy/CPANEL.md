# Deploy to Namecheap (cPanel) — Stellar plan

Total time: ~20 minutes. You need: the Stellar plan, a domain, and `asset_manager-cpanel.zip`
(build it with `npm run package:cpanel` → `release/asset_manager-cpanel.zip`).

> Replace `USER` below with your cPanel username (shown top-right in cPanel) and
> `farm.yourdomain.com` with your real (sub)domain.

---

## 1. Domain + HTTPS (needed for “Install app” on the phone)
1. cPanel → **Domains** → **Create A New Domain** → `farm.yourdomain.com`
   (a subdomain keeps the app separate from any website). Untick “Share document root”.
2. cPanel → **SSL/TLS Status** → select the domain → **Run AutoSSL**. Wait until it shows a green lock.
3. cPanel → **Domains** → turn **Force HTTPS Redirect** ON for that domain.

## 2. Upload the app
1. cPanel → **File Manager** → open your **home folder** (`/home/USER`, NOT `public_html`).
2. **Upload** → `asset_manager-cpanel.zip`.
3. Right-click the zip → **Extract** → into `/home/USER`. You now have `/home/USER/asset_manager/`.
4. Create an empty folder `/home/USER/asset_manager_data` (your database + photos live here,
   so updating the app never touches your data).

## 3. Create the Node.js app
cPanel → **Setup Node.js App** → **Create Application**:

| Field | Value |
|---|---|
| Node.js version | the **highest 22.x** in the list |
| Application mode | Production |
| Application root | `asset_manager` |
| Application URL | `farm.yourdomain.com` (leave the path empty) |
| Application startup file | `app.js` |

**Environment variables** → Add Variable:

| Name | Value |
|---|---|
| `APP_PIN` | your secret PIN, e.g. `4827` (not 1234!) |
| `DATA_DIR` | `/home/USER/asset_manager_data` |

Click **Create**.

## 4. Install & start
1. On the same page click **Run NPM Install** (installs Express only, ~30 sec).
2. Click **Restart**.
3. Open `https://farm.yourdomain.com` → enter the PIN → done.

## 5. On your father's phone
Open the link in **Chrome** → menu ⋮ → **Install app / Add to Home screen**
(or tap the **“⬇ መተግበሪያ ጫን”** button in the app). Enter the PIN once.

## 6. Daily backup (recommended)
cPanel → **Cron Jobs** → Common settings: **Once per day** → Command:
```
cd /home/USER/asset_manager && DATA_DIR=/home/USER/asset_manager_data /home/USER/nodevenv/asset_manager/22/bin/node backup.mjs
```
Backups go to `/home/USER/asset_manager_data/backups` (last 30 days).
Download that folder now and then from File Manager to keep an offline copy.

---

## Updating to a new version
1. Build a new zip (`npm run package:cpanel`).
2. File Manager → upload → Extract into `/home/USER` → **overwrite** files.
3. Setup Node.js App → **Restart**. (Data in `asset_manager_data` is untouched.)

## If something goes wrong
| Problem | Fix |
|---|---|
| Page shows an error / 503 | File Manager → open `/home/USER/asset_manager/stderr.log` and read the last lines |
| Log says **“needs Node.js 22.13 or newer”** | Setup Node.js App → pick the newest 22.x, **or** add env variable `NODE_OPTIONS` = `--experimental-sqlite` → Restart |
| “Wrong PIN” | Check `APP_PIN` in Setup Node.js App → Restart after changing |
| No “Install app” on phone | The site must open with **https://** and a green lock (step 1) |
| Photo upload fails | Photos are shrunk on the phone first; if it still fails, ask Namecheap support to raise the upload/request size limit |
