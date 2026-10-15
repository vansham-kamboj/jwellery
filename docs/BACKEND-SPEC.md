# Avya Jewels — Backend Spec (v1)

Status: **draft for approval** · Stack: Laravel 12 · MySQL/MariaDB · Filament 4 admin · CAD

---

## 1. How it fits together

```
yourdomain.com/            → storefront (version 1 design, static HTML/CSS/JS)
yourdomain.com/api/...     → JSON API (Laravel) — the only thing the storefront talks to
yourdomain.com/<secret>/   → admin panel (Filament), one admin account
```

- One Laravel app serves all three, on one domain → no CORS, one SSL certificate, one deploy.
- **The UI is swappable:** the storefront is plain files in `backend/public/` that only read/write
  through `/api`. A future redesign replaces those files; the backend, database and admin stay untouched.
- Code lives in `backend/` inside this repo. The current Vercel site (root + `version N/` folders) is not affected.

## 2. Order flow (WhatsApp)

1. Customer browses, picks finish + size, adds to bag (bag is kept in the browser).
2. Checkout form: **name, phone (required), email (optional), address, city, province, postal code, note**,
   delivery option, gift wrap.
3. Customer taps **"Place order on WhatsApp"**:
   - The server **re-prices every line from the database** (prices, offers, fees — never trusted from the browser),
     saves the order as **New** with a code like `AVY-1042`, and returns a WhatsApp link.
   - WhatsApp opens to **+91 83204 95754** (admin setting) with the message pre-typed.
4. Customer sees: *"Order request AVY-1042 created — send the WhatsApp message to confirm. Our team will reply
   with payment details."* (Never "confirmed" — the site can't know that.)
5. Team handles payment on WhatsApp, then updates the status in admin.

**Statuses:** `New` → `Confirmed` (paid) → `Shipped` → `Completed` · or `Cancelled` at any point.
Each change is timestamped. New orders that never arrive on WhatsApp are simply cancelled by the team.

**Message format:**
```
Hi Avya Jewels! I'd like to place an order.

Order: AVY-1042
1. Halo Hoops — Gold vermeil, Small × 1 — $68.00
2. Fil Chain — Sterling silver, 18" × 2 — $96.00 (was $120.00, Autumn sale −20%)

Subtotal: $164.00
Shipping (Standard): Free
Gift wrap: $6.00
HST (13%): $22.10
Total: $192.10 CAD

Name: Priya Sharma
Phone: +1 416 555 0182
Address: 12 King St W, Toronto, ON M5H 1A1
Note: Birthday gift, please hide the price.
```

## 3. Catalogue rules

- **Stock is manual, no counting.** Each product has *In stock / Sold out* and *Visible / Hidden*.
  Sold-out items stay visible with a "Sold out" label and no Add button. Each finish and size can also be
  switched off individually (e.g. silver sold out, gold still available).
- **Finishes** are a shared list (Gold vermeil, Sterling silver, Rose gold…) with a swatch colour.
  Each product picks which finishes it offers, each with an optional price difference (e.g. +$12).
- **Sizes** are set per product (e.g. Small/Medium, 16"/18", ring 5–9).
- **Images:** many per product, drag to reorder, first = main. Auto-resized to WebP (400 / 800 / 1600 px);
  files stored on disk, only paths in the database.

## 4. Offers

An offer = **name**, **type** (percent or fixed $ off), **value**, **start/end date**, **active** switch,
optional **badge text** ("Autumn sale"), and **what it applies to** — any combination of:
categories · finishes · price range (min/max) · hand-picked products · everything.

- If several offers match an item, **the single best discount wins** (no stacking).
- Price never goes below $0. Storefront shows the old price crossed out + badge.
- Admin form shows a live count: *"Applies to 14 products"*.

## 5. Database tables

| Table | Key columns |
|---|---|
| `users` | the single admin (name, email, password hash, 2FA secret) |
| `categories` | name, slug, blurb, image, sort_order, is_visible |
| `finishes` | name, slug, swatch_hex, sort_order |
| `products` | category_id, name, slug, material_line, description, base_price, tag (Bestseller/New/–), in_stock, is_visible, is_featured, sort_order, soft-deletes |
| `finish_product` | product_id, finish_id, price_adjustment, in_stock |
| `product_sizes` | product_id, label, sort_order, in_stock |
| `media` | product/category images (via spatie/laravel-medialibrary) |
| `reviews` | author_name, city, product_id (optional), rating 1–5, body, is_featured (home page), is_visible, reviewed_on |
| `offers` | name, badge, type, value, starts_at, ends_at, is_active, min_price, max_price, applies_to_all |
| `offer_category` / `offer_finish` / `offer_product` | offer targeting |
| `orders` | code, status, customer name/phone/email/address/note, delivery_method, delivery_fee, gift_wrap_fee, subtotal, discount_total, tax_rate, tax, total, currency, whatsapp_message, admin_notes, status timestamps, ip_hash |
| `order_items` | order_id, product_id (nullable), **snapshot** of name/finish/size, unit_price, original_price, offer_name, qty, line_total |
| `custom_requests` | Custom-order form: name, phone, email, piece type, metal, budget, details, reference photo, status |
| `fitting_bookings` | name, phone, date, time slot, status |
| `subscribers` | newsletter emails |
| `settings` | WhatsApp number, shipping fees, free-shipping threshold, gift-wrap fee, tax %, announcement bar texts, store address & hours |

Order items keep a snapshot, so editing or deleting a product never changes past orders.

## 6. Public API (`/api`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/site` | settings, categories, finishes, announcement texts |
| GET | `/api/products?category=&finish=&sort=` | product list with current offer prices |
| GET | `/api/products/{slug}` | product detail, images, finishes, sizes, reviews |
| GET | `/api/reviews` | featured reviews for home page |
| POST | `/api/cart/quote` | re-price a bag (used on bag & checkout pages) |
| POST | `/api/orders` | create order → returns code + WhatsApp link |
| POST | `/api/custom-requests` | custom order form (with photo upload) |
| GET | `/api/bookings/slots?date=` | free fitting slots |
| POST | `/api/bookings` | book a fitting |
| POST | `/api/subscribe` | newsletter |

All read endpoints are cached; all POST endpoints are validated and rate-limited.

## 7. Admin panel

- **Dashboard:** cards for New / Confirmed / Shipped / Completed / Cancelled, orders today, confirmed sales this month;
  latest orders list.
- **Orders:** tabs by status, search by code/name/phone, order detail with items and customer info,
  one-click status change, private notes, "Chat on WhatsApp" button to the customer.
- **Products:** add / edit / hide / delete, images, finishes & prices, sizes, in-stock switches, duplicate product.
- **Categories · Finishes · Reviews · Offers** (with live "applies to N products").
- **Custom requests · Fitting bookings · Subscribers** (status + export CSV).
- **Settings:** WhatsApp number, fees, tax %, announcement bar, store info.

## 8. Security

- Prices, offers and totals always computed on the server.
- Admin: hidden URL, bcrypt passwords, login rate-limit (5 tries/min), optional 2-factor code, session timeout.
- Rate limits on order/form endpoints + honeypot field against bots.
- Uploads: images only (jpg/png/webp), size limit, re-encoded, random names, no script execution in storage.
- All input validated; all output escaped (storefront already escapes).
- HTTPS only, secure cookies, security headers, CSRF on admin, `.env` secrets never committed.
- Daily automatic backup of database + images (spatie/laravel-backup), kept 14 days.

## 9. Assumptions (changeable later in admin)

- Tax: HST 13% (current site) — set to 0% in settings if not needed.
- Shipping: Canada Post Standard $12 (free over $150), Expedited $22, studio pick-up free; gift wrap $6 (current site values).
- Track-order page and Instagram ordering removed.
- Storefront: version 1 design, renamed to Avya Jewels.

## 10. Build phases

1. Laravel + database + seed with the current 12 products, reviews and content
2. Admin panel (all screens above)
3. Public API + pricing/offer engine + automated tests
4. Connect the version 1 storefront to the API, WhatsApp checkout, remove Track page
5. Security hardening, backups, deployment guide for the hosting you buy

## 11. Hosting requirements (for when you buy)

PHP 8.2+ (with intl, gd, pdo_mysql, zip, fileinfo) · MySQL 8 or MariaDB 10.4+ · SSH access preferred ·
cron jobs · free SSL. A small VPS or a good cPanel host both work.
