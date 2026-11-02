# Auto-deploy: push to GitHub → live on cPanel

Every push to `main` runs **.github/workflows/deploy-cpanel.yml**:
build on GitHub → upload over SSH → `npm install` → restart the app.
Your data (`asset_manager_data`) is never touched. One-time setup, ~10 minutes.

Values for this account:

| What | Value |
|---|---|
| SSH host | `za-s1.serverpanel.com` |
| cPanel user | `booksbab` |
| SSH port | ask Shock Hosting (often `22`, sometimes a custom port) |
| App folder | `asset_manager` (Node.js 24) |

---

## 1. Create a deploy key (on your Mac)
```bash
ssh-keygen -t ed25519 -C github-deploy -f ~/.ssh/asset_manager_deploy -N ""
```
This makes two files: `asset_manager_deploy` (private, secret) and `asset_manager_deploy.pub` (public).

## 2. Allow the key on cPanel
1. Copy the **public** key: `pbcopy < ~/.ssh/asset_manager_deploy.pub`
2. cPanel → **SSH Access** → **Manage SSH Keys** → **Import Key**
   - Name: `github-deploy` · paste into **Public Key** → **Import**
3. Back on Manage SSH Keys → next to `github-deploy` click **Manage** → **Authorize**.

## 3. Test from your Mac
```bash
ssh -i ~/.ssh/asset_manager_deploy -p 22 booksbab@za-s1.serverpanel.com "echo SSH works"
```
Prints `SSH works` → good. “Connection refused / timed out” → ask Shock Hosting support to
**enable SSH access** for user `booksbab` and tell you the **SSH port**; use that port everywhere.

## 4. Add secrets on GitHub
GitHub → repo **asset_manager** → **Settings** → **Secrets and variables** → **Actions**

**Secrets** tab → **New repository secret** (4×):

| Name | Value |
|---|---|
| `CPANEL_HOST` | `za-s1.serverpanel.com` |
| `CPANEL_USER` | `booksbab` |
| `CPANEL_PORT` | your SSH port (e.g. `22`) |
| `CPANEL_SSH_KEY` | the **private** key: run `pbcopy < ~/.ssh/asset_manager_deploy` and paste |

**Variables** tab → **New repository variable** (optional, enables a live check after deploy):

| Name | Value |
|---|---|
| `APP_URL` | `https://farm.booksbabu.org` |

> Never paste the private key anywhere else (chat, email, code).

## 5. Run it
GitHub → **Actions** → **Deploy to cPanel** → **Run workflow** (or just push to `main`).
A green ✓ means it is live. A red ✗ → open the failed step and read the message.

---

## Notes
- Changing **environment variables** (APP_PIN, DATA_DIR, WELL_KNOWN_DIR) is still done in
  cPanel → Setup Node.js App — they are not in the code.
- If you change the Node.js version in cPanel (e.g. to 26), add a repository **variable**
  `CPANEL_NODE_VERSION` = `26`.
- Manual deploy (zip upload, `deploy/CPANEL.md`) still works as a fallback.
