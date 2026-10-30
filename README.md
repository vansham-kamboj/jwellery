# Avya Jewels

Online store for Avya Jewels — 925 sterling silver jewellery and 99.99% pure gold and silver bullion, Mississauga.

```
backend/    Laravel 12 API + admin panel (products, orders, offers, reviews, settings) — PHP + MySQL
frontend/   the storefront customers see — plain HTML/CSS/JS, loads its data from the backend API
assets/     product photos used by the storefront and to seed the backend
```

All settings live in `.env` files only: `backend/.env` and `frontend/.env` (copy each `.env.example`). They are never committed.

## Run it on your computer

Needs PHP 8.2+, Composer, MySQL/MariaDB (e.g. XAMPP) and Node.js.

```bash
# 1. backend — first time
cd backend
composer install
cp .env.example .env            # fill in DB_*, ADMIN_EMAIL, ADMIN_PASSWORD, STORE_WHATSAPP …
php artisan key:generate
php artisan migrate --seed      # tables, first admin, 40-piece catalogue with photos
php artisan serve               # http://127.0.0.1:8000/admin

# 2. frontend — in a second terminal, from the project root
cp frontend/.env.example frontend/.env    # AVYA_API_URL=http://127.0.0.1:8000/api
node frontend/build-env.js
node .claude/serve.js 5173                # store at http://localhost:5173/ · admin at http://localhost:5173/admin
```

The backend's `FRONTEND_URLS` must include the storefront address (`http://localhost:5173` locally).

## Put it online

**Backend → Hostinger** (PHP + MySQL). Upload the `backend/` and `assets/` folders side by side, create a MySQL database in hPanel, then follow *Production* in [backend/README.md](backend/README.md). Use a subdomain such as `api.yourdomain.com`.

**Storefront → Vercel** (or any static host). Import this repository in Vercel; `vercel.json` serves the storefront at the site root (no `/frontend/` in the address) and builds `frontend/js/site-env.js` on every deploy, and `.vercelignore` keeps the backend code off Vercel. In Vercel → Settings → Environment Variables add:

| Name | Value |
|---|---|
| `AVYA_API_URL` | `https://api.yourdomain.com/api` |
| `WHATSAPP_API_URL` | `https://wa.me` |

Then add the Vercel address (and your own domain) to `FRONTEND_URLS` in `backend/.env`.

**Storefront on Hostinger instead:** run `node frontend/build-env.js` with the live `AVYA_API_URL` in `frontend/.env`, then upload `.htaccess`, `index.html`, `frontend/` and `assets/` to `public_html/` (keep them side by side). The root `.htaccess` serves the storefront at `https://yourdomain/` — `/frontend/` never shows in the address — and, with `backend/` in `public_html/` too, the admin panel at `https://yourdomain/admin` (keep `ADMIN_PATH=admin`).

Until `AVYA_API_URL` is set, the storefront still works using its built-in catalogue — orders then go straight to WhatsApp. Once it is set, the built-in catalogue is never shown: if the API can't be reached, visitors see a short "We'll be right back" notice and the page keeps retrying.
