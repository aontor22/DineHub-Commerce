# DineHub Commerce · Dining Products eCommerce

A custom dining and tableware eCommerce starter built from the requested DineHub visual direction. This is an original storefront, **not a clone of naturebd.com**.

> **Status:** Full-stack implementation/source code supplied with seeded demo products, local unit tests and configuration templates. This environment could not install npm packages or run a PostgreSQL/SSLCommerz integration, so **a production deployment is not yet verified**. Follow the launch checklist before taking real money or customer data.

## Implemented

**Customer experience**
- Responsive shopping homepage, dynamic category catalog and product search, category/material filters, sorting and pagination
- Product detail pages, gallery, availability, variants (size/set), stock-based quantity limits, verified-purchase review submissions
- Local shopping cart and guest wishlist; authenticated wishlists stored in PostgreSQL
- Coupon validation and checkout quotes recalculated on the **server**; guest/customer checkout with Bangladesh delivery fields
- Cash on Delivery and optional SSLCOMMERZ hosted checkout
- Guest order tracking with order ID + phone or a private tracking token; logged-in order history and profile editing
- Email/password signup/sign-in, 7-day secure HTTP-only sessions; optional Google Identity sign-in
- Optional analytics/Meta Pixel with explicit user consent and UTM attribution per order
- Shipping, refund, privacy, and terms **template** pages

**Admin dashboard**
- Revenue and order stats, recent sales, monthly sales, campaign attribution, order fulfillment statuses
- Create/update/hide products; manage variants, price and stock; authenticated product image uploads (optional Cloudinary)
- Add/edit categories, create/enable/disable coupons, view full order details, restore inventory upon eligible cancellation
- Admin-only backend permissions, server-side PostgreSQL parameterized queries
- Optional Resend transactional order notifications

**Not a launch guarantee**
- SSLCommerz sandbox/live transactions, emails, Google OAuth, hosted database, asset uploads and deployment have **not been end-to-end tested here**.
- Automated refunds, courier integrations, shipping label generation, mobile SMS/WhatsApp updates, warehouse syncing, tax invoicing, password recovery, a full return-approval workflow, and SEO server rendering are **not included**.
- Refund, shipping, contact and privacy/legal copy are templates; update before public launch.

## Stack

| Layer | Implementation |
|---|---|
| Customer + admin web | React 19, Vite 6, React Router, Lucide, responsive CSS |
| API | Node.js 20.19+, Express 4, JavaScript ESM |
| Data | PostgreSQL 16 (Docker) or hosted PostgreSQL/Neon; SQL initialization |
| Auth | bcryptjs, signed JWT in HttpOnly cookie, optional Google ID token validation |
| Payments | SSLCommerz Hosted Payment API + server-side Order Validation/IPN |
| Images | Local sample WebP assets; optional Cloudinary authenticated uploads |
| Ads | UTM attribution, consent-gated Meta Pixel and Google Analytics 4 |
| Notifications | Optional Resend REST API |

## Quick start (local / GitHub Codespaces)

Requires Node.js 20.19+ (Node.js 22 LTS recommended), npm and PostgreSQL or Docker.

```bash
# 1. From repository root:
npm install

# 2. Environment templates:
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Create a strong JWT secret; paste output into server/.env as JWT_SECRET:
openssl rand -hex 32

# 4. Start PostgreSQL if Docker is available:
docker compose up -d db

# 5. Create tables & sample items:
npm run db:init -w server
npm run db:seed -w server

# 6. Run customer and admin app together:
npm run dev
```

**Web:** http://localhost:5173  
**API health:** http://localhost:4000/api/health  
**Storefront:** `/`  
**Administration:** `/admin` (requires an ADMIN account)

If Docker is unavailable, create a PostgreSQL database on Neon or your preferred provider, set `DATABASE_URL` in `server/.env`, and run `db:init` and `db:seed` using that connection. Alternatively, paste `server/sql/schema.sql` into the Neon SQL Editor and run the Node.js seed command from your terminal. The SQL schema is designed for a **fresh database**; for subsequent releases, introduce versioned SQL migrations rather than re-running a fresh schema on existing data.

### Admin account (no default credentials)

Set in `server/.env` before seeding:

```ini
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=replace-with-a-unique-strong-password-12-chars-minimum
```

Then run `npm run db:seed -w server` and log in at `/login` using those details. The seeding script will hash the password and assign the ADMIN role. **Never** use the sample values or publish the admin password in Git.

### Sample catalog

Eight dynamic categories and fourteen dining products: dinner sets, bowls, plates, cups, cutlery, glassware and serveware. The sample coupon `WELCOME10` offers 10% off baskets of at least ৳1,000, subject to configured usage limits. Sample product imagery has been cropped from the design mockup and must be replaced with actual inventory photography before commercial use.

## SSLCommerz

Official guide: https://developer.sslcommerz.com/doc/v4/

1. Register for sandbox merchant credentials.
2. Configure the following in the **server's** environment (never in `VITE_` variables):

```ini
SSL_ENABLED=true
SSL_SANDBOX=true
SSL_STORE_ID=your_sandbox_store_id
SSL_STORE_PASSWORD=your_sandbox_store_password
API_PUBLIC_URL=https://your-public-api.example.com
WEB_ORIGIN=https://your-store.example.com
```

3. Payment callbacks are:
   - `POST /api/payments/ssl/ipn`
   - `POST /api/payments/ssl/success`
   - `POST /api/payments/ssl/fail`
   - `POST /api/payments/ssl/cancel`
4. The checkout session is created **server-side**, customer is redirected to the gateway, and payment is marked paid only after calling the **Order Validation API** and checking transaction ID, amount, BDT currency, store ID and non-high-risk status.
5. Test success, failure, cancellation, delayed IPN, and callback replay in sandbox before switching to `SSL_SANDBOX=false` with production merchant credentials.

**Localhost cannot receive gateway server-to-server IPN.** Test with an HTTPS tunnel or deployed public API endpoint. Expired unpaid reservations are reconciled against the gateway by session ID; stock is released only when the merchant API confirms a terminal failed/cancelled transaction, and uncertain or pending cases remain reserved for manual investigation. For timely reconciliation schedule an authenticated POST to `/api/internal/expire-payments` with `Authorization: Bearer <CRON_SECRET>` every hour. Monitor payment reconciliation and review long-pending orders; a confirmed but high-risk payment is intentionally not auto-fulfilled.

### Email, Google and image upload (all optional)

**Google:** Create a Google Web OAuth client. Use the same client ID in `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (client). Allow your local/production frontend origin in the Google console.

**Cloudinary:** Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to server environment to enable admin images up to 5MB. Without them, paste hosted image URLs into the admin product editor.

**Resend:** Configure a verified sender domain and add `RESEND_API_KEY`, `MAIL_FROM` and optional `ADMIN_NOTIFY_EMAIL` on the server for customer/admin email notifications. Without keys, orders still work but no email is sent.

**Marketing:** Set `VITE_META_PIXEL_ID` and/or `VITE_GA4_ID` in the frontend and republish. Tags only load after the visitor accepts marketing cookies. UTM query parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) are stored in the customer's browser and attached to the order for campaign attribution. Respect your own regional consent and privacy policies.

## Deploy: Vercel + Render + Neon

**Database: Neon / PostgreSQL**
1. Create PostgreSQL database; copy connection string with TLS enabled.
2. Put `DATABASE_URL` in Render's private environment.
3. Run the schema + seed from Codespaces/terminal with the same connection string. Do not store it in your Git repository.

**API: Render**
- Create a Node Web Service from this repo, **Root Directory:** `server`.
- Build command: `npm install`
- Start command: `npm start`
- Add server environment settings: `NODE_ENV=production`, `PORT` (normally Render provides this), `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `API_PUBLIC_URL` and any optional integration keys.
- `API_PUBLIC_URL` must equal your public backend HTTPS origin (without trailing slash).

**Frontend: Vercel**
- Deploy project with **Root Directory:** `client`, framework Vite, build `npm run build`, output `dist`.
- Add `VITE_API_URL` set to the backend's absolute `https://.../api` URL if you don't have an API reverse proxy.
- The included `client/vercel.json` rewrites unknown paths to `index.html`, fixing React Router hard-refresh 404s.

**Cookies & domains**
- Best: use a same-site HTTPS reverse proxy so the store calls `/api`, with the API hosted under the same domain; use `VITE_API_URL=/api`, `COOKIE_SAMESITE=lax`.
- If frontend and API **must** be on different sites (`*.vercel.app` and `*.onrender.com`), set `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, `WEB_ORIGIN` exactly to your frontend URL. **Third-party cookie restrictions may break sessions on some browsers**. The API enforces allowed Origins for cookie-authenticated writes; a same-site proxy is more reliable.
- Example reverse-proxy configuration: `client/vercel.same-origin.example.json` (replace placeholder backend URL, rename to `vercel.json`).

## Test & audit

```bash
npm run check        # JavaScript syntax checks on backend
npm run test         # Node built-in unit tests for pricing and payment matching
npm run build        # Vite production build (requires npm install)
```

**Critical test cases before real-world use**

- [ ] Create an account, log out, log in, reload, and confirm HttpOnly 7-day session
- [ ] Confirm CUSTOMER users cannot access any `/api/admin/*` endpoint
- [ ] Create/edit category, product, image and variants; test stock = 0 state
- [ ] Try price and quantity tampering by editing checkout API payload; server must use DB prices
- [ ] Place COD order as guest and as logged-in customer, track with ID + phone
- [ ] Verify cancelling an unpaid order restores exact inventory, once only
- [ ] Try invalid/expired/exhausted coupon and simultaneous low-stock checkouts
- [ ] Run SSLCommerz sandbox successful payment, failed/cancelled payment, IPN replay, mismatched amount and delayed callback
- [ ] Confirm a successful SSL payment cannot be marked paid from a spoofed browser callback
- [ ] Verify email, Google, image upload, Meta/GA4 consent if configured
- [ ] Test phone, tablet, desktop, keyboard navigation and popular browsers
- [ ] Replace demo photos, branding, hotline, real terms/refunds/shipping/privacy pages
- [ ] Add backups, monitoring, uptime checks, legal verification and a production migration strategy

## API overview

**Public:** `GET /api/health`, `/api/categories`, `/api/products`, `/api/products/:slug`, `POST /api/products/by-ids`, `/api/orders/quote`, `/api/orders`, `/api/orders/track`, `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, `POST /api/auth/logout`.

**Account:** `GET/PATCH /api/auth/me`, `GET /api/orders/mine`, `GET/PUT/DELETE /api/wishlist/*`, `POST /api/products/:id/reviews` (delivered purchases only).

**Admin:** `GET /api/admin/dashboard`, `/api/admin/orders`, `/api/admin/products`, `/api/admin/categories`, `/api/admin/coupons`; `POST/PUT/PATCH` management routes in `server/src/admin.js`, plus `/api/admin/upload`.

## Directory map

```text
DineHub-Commerce/
├─ client/
│  ├─ public/images/             # bundled dining demo visuals
│  ├─ src/components/            # header, cards, marketing consent
│  ├─ src/pages/                 # home, shop, product, cart, checkout, admin ...
│  ├─ src/analytics.js           # UTM + consent-gated advertising tags
│  ├─ src/store.jsx              # auth, cart, wishlist, API client
│  ├─ src/styles.css             # desktop/tablet/mobile layout
│  └─ vercel.json
├─ server/
│  ├─ sql/schema.sql             # fresh PostgreSQL schema
│  ├─ src/                       # Express APIs, auth, orders, payments, admin
│  ├─ tests/                     # Node unit tests
│  └─ .env.example
├─ docker-compose.yml
└─ package.json                  # npm workspaces
```

### Reference documentation
- SSLCommerz: https://developer.sslcommerz.com/doc/v4/
- Cloudinary upload: https://cloudinary.com/documentation/node_image_and_video_upload
- Google ID token verification: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- OWASP session cookie recommendations: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- Resend API: https://resend.com/docs/api-reference/emails/send-email
- React Router: https://reactrouter.com/

---

Demo project identity: **DineHub**. You may replace the brand, colors, product imagery, inventory, prices and policies for your own dining-products business.
