# Avya Jewels — backend

Laravel 12 API + teal admin panel. It is **frontend-agnostic**: any storefront design talks to it only through `/api`, so designs can change without touching the backend, database or admin.

```
APP_URL/api/...          JSON API for storefronts (no login)
APP_URL/{ADMIN_PATH}     admin panel (login required)
```

## Configuration lives in `.env` only

Every URL, number, account and secret is read from `.env` (see `.env.example` for the full list): database, allowed storefront URLs (`FRONTEND_URLS`, used for CORS), admin path and first admin account, WhatsApp click-to-chat URL, store contact details, admin fonts. Nothing external is hard-coded in the code. `.env` is git-ignored — never commit it.

Business settings (WhatsApp number, social links, fees, tax by province, delivery options, booking hours) start from `.env`/defaults and are then edited in **Admin → Settings**.

## Setup

Requirements: PHP 8.2+ with `pdo_mysql`, `gd`, `mbstring`, `fileinfo`, `openssl`, `zip` · Composer · MySQL 8 / MariaDB 10.4+.

```bash
composer install
cp .env.example .env          # then fill in DB_*, APP_URL, FRONTEND_URLS, ADMIN_*, STORE_*
php artisan key:generate
php artisan migrate --seed    # tables + first admin + the 40-piece catalogue with photos
php artisan storage:link
php artisan serve             # local: http://127.0.0.1:8000/admin
```

After the first sign-in, change the password in **Settings → Your password** and remove `ADMIN_PASSWORD` from `.env`.

The starting catalogue (40 pieces, 14 categories) is in `database/seeders/data/catalog.json`; its photos are copied from `../assets` and resized to WebP. Re-seeding never overwrites products that already exist — after launch, manage everything in the admin panel.

Useful commands:

```bash
php artisan db:seed --class=QuestionnaireContentSeeder   # re-apply the client's questionnaire settings and categories
php artisan store:optimize-images                        # shrink any stored photos that aren't WebP yet
```

### Production (e.g. Hostinger)

1. Point the (sub)domain at `backend/public`. If the host won't let you, point it at `backend/` — the included `.htaccess` forwards everything into `public/`.
2. In `.env`: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://<backend domain>`, the database details, `FRONTEND_URLS=https://<storefront domain>`, `SESSION_SECURE_COOKIE=true`, and a hard-to-guess `ADMIN_PATH`.
3. `composer install --no-dev --optimize-autoloader`, `php artisan key:generate` (first time only), `php artisan migrate --seed --force`, `php artisan storage:link`, then `php artisan config:cache`, `php artisan route:cache` and `php artisan view:cache` (run these again after every update).
4. Folders `storage/` and `bootstrap/cache/` must be writable by the web server.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/site` | public settings (contact, socials, fees, tax rates, delivery options, booking hours), categories, finishes |
| GET | `/api/products?category=&kind=&metal=&finish=&q=&featured=1&sort=&per_page=` | product list with offer prices |
| GET | `/api/products/{slug}` | product detail: gallery, sizes, finishes, care |
| POST | `/api/cart/quote` | price a bag (`items[{product, finish, size, qty}]`, `delivery`, `province`, `gift_wrap`) |
| POST | `/api/orders` | save the order → `{code, whatsapp_url, total, …}` |
| POST | `/api/custom-requests` | bespoke request (multipart, optional `reference_image`) |
| GET | `/api/bookings/slots?date=YYYY-MM-DD` | free studio slots |
| POST | `/api/bookings` | book a slot |
| POST | `/api/subscribe` | newsletter |

Rules: prices, offers, tax and totals are always computed on the server; bullion at or above the reserve limit is one per order and flagged for a price quote; tax-exempt bullion is never taxed; sold-out pieces, finishes and sizes are refused. POST endpoints are rate-limited and have a `website` honeypot field that must stay empty.

## Admin panel

Dashboard · Orders (status New → Confirmed → Shipped → Completed / Cancelled, private notes, WhatsApp the customer) · Products (photos & videos, finishes with price changes, sizes, stock, visibility, duplicate) · Categories · Finishes · Offers (percent or fixed, dates, by category / product / price range — best single offer wins) · Custom requests · Bookings · Subscribers (CSV export) · Settings.

Security: hidden admin path, bcrypt passwords, 5 sign-in tries per minute, encrypted sessions, CSRF on every form, security headers, uploads limited to images/videos and stored outside the code, `noindex` on all admin pages.

## Tests

```bash
php artisan test
```
