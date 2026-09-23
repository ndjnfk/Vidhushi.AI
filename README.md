# Vidushiji.ai

A Vedic astrology platform.

**Phase 1** (done): the core calculation engine — Kundli (birth chart)
generation, Panchang, Vimshottari Dasha, and Ashtakoot Guna Milan
compatibility matching.

**Phase 2** (done): payments + bookings.
- A **configurable, admin-controlled payment gateway layer** — Mock (dev
  default), Razorpay, PayU, Stripe, Cashfree. The active gateway and its
  credentials are set at runtime by an admin via `PUT /admin/payment-settings`
  (stored in Mongo, not `.env`) — only the gateway/payment-methods the admin
  has enabled are ever shown to a user (`GET /payments/gateways`).
- **Vendor management**: astrologers/pandits/ritual specialists are onboarded
  as `Vendor` records (`POST /admin/vendors`, approve/suspend via
  `PUT /admin/vendors/{id}/status`), each with a commission rate; every paid
  `Order` tracks the resulting platform-commission/vendor-payout split
  (`GET /admin/vendors/{id}/payouts`). Actual money transfer to vendors is
  still a manual step (`mark-paid`) — no payout-gateway integration yet.
- **Poojas**: service catalog + booking (sankalp details) + payment.
- **Spells / candle rituals**: intention-based bookings (visa delays, health,
  court matters, evil-eye removal, new-home manifestation, or custom),
  weekly — each week is its own payable "renew" cycle, not a gateway
  auto-debit subscription (see code comments in `app/api/routes/rituals.py`).
- **Astrologer chat consultations**: book a flat-rate session, pay, get a
  chat room (simple polling, no WebSocket yet).

**Phase 3** (in progress — order: Tarot → Blog → Multi-language → Shop →
Recurring billing → White-label; video/voice consultations deliberately last):
- **Tarot** (done): free, no-login 78-card readings (single card / past-present-
  future spreads), `app/tarot/`, `/tarot` + `/tarot/[id]`.
- **Blog** (done): admin-authored posts (Markdown body, tags), public
  `/blog` + `/blog/[slug]`, admin CRUD under `/admin/blog`.
- **Multi-language UI** (done): English, Hindi, Punjabi, Marathi, Gujarati —
  a client-side language switcher (`apps/web/lib/i18n/`), not locale-prefixed
  routing (see "Multi-language" section below for the tradeoff and a
  translation-quality caveat).
- **Shop** (done): product catalog (`app/api/routes/shop.py`), cart
  (client-side, `apps/web/lib/CartContext.tsx`), checkout reuses the same
  Order/payment flow as poojas/rituals/consultations, stock is decremented
  on successful payment (not reserved at checkout — a small oversell risk
  under concurrent checkouts, acceptable for MVP).
- **Real auto-recurring billing** (done): rituals can switch from the
  manual weekly-renew MVP to a real gateway subscription
  (`POST /rituals/bookings/{id}/enable-auto-renew`) — Razorpay and Stripe
  implement real Subscriptions APIs with webhook signature verification
  (`app/payments/razorpay_gateway.py`, `stripe_gateway.py`); PayU/Cashfree
  don't support subscriptions and raise a clear error if selected. The
  webhook handler (`POST /payments/webhook/{gateway}`) verifies the
  signature, creates an `Order` + `RitualCharge` audit record per charge,
  applies vendor payout, and advances `next_candle_date` — proven
  end-to-end with the Mock gateway (real signature-verification logic is
  unit-tested directly against Razorpay's and Stripe's real signing
  schemes, using a known secret, since there's no live account to receive
  real webhook calls from).
- **White-label vendor sites** (done): a vendor gets a branded storefront
  page — set via `PUT /admin/vendors/{id}/storefront` (slug, custom domain,
  branding: display name/tagline/logo/color/about). `GET /storefront/{slug}`
  and `GET /storefront/resolve?host=` (public) resolve it; the frontend's
  `proxy.ts` (Next.js middleware) detects a non-primary Host header and
  rewrites `/` to `/vendor/{slug}`, so once a vendor's domain actually
  points at this deployment (Cloudflare DNS, done outside the app — no
  verification flow here, just the domain→vendor mapping), their domain
  shows their branded page automatically. The storefront is a single
  landing page (bio + inline consultation booking) for this MVP, not a
  full multi-route site.
- Only **video/voice consultations** remain — deliberately last.

## Architecture

- `apps/api` — FastAPI backend. All astrology math lives in `app/astro/`
  and has no framework dependencies — it's pure, testable Python.
  - Sidereal planetary positions via `pyswisseph` (Swiss Ephemeris), Lahiri ayanamsa.
  - MongoDB (via Motor + Beanie) for persistence.
- `apps/web` — Next.js (TypeScript, Tailwind) frontend. Renders North Indian
  and South Indian style birth charts as SVG.

## Running locally

### Backend

```
cd apps/api
python -m venv .venv
.venv/Scripts/activate      # Windows
pip install -r requirements.txt
cp .env.example .env        # edit JWT_SECRET, MONGO_URI as needed
uvicorn app.main:app --reload
```

Requires MongoDB running locally (`mongodb://localhost:27017` by default —
see `docker-compose.yml`, or run `mongod` directly).

API docs: http://localhost:8000/docs

Run tests: `pytest app/tests -v`

### Frontend

```
cd apps/web
npm install
cp .env.local.example .env.local
npm run dev
```

App: http://localhost:3000

### Everything via Docker Compose

```
docker compose up --build
```

## Notes on astrological accuracy

- Ayanamsa: Lahiri (the standard used by mainstream Indian/Vedic sites).
- House system: whole-sign, from the Lagna (ascendant).
- The Vashya koota (part of Guna Milan) uses a simplified whole-sign
  grouping; classical texts subdivide a few signs by half. Refine
  `app/astro/constants.py::VASHYA_GROUP` against a reference text before
  relying on this for paid/production matching reports.
- Geocoding for the birth-place search uses the free Nominatim
  (OpenStreetMap) API in `apps/web/components/forms/BirthDetailsForm.tsx`.
  It's rate-limited — swap in a paid geocoding API before production traffic.

## Payments

- The **first user ever registered becomes an admin** (bootstrap — see
  `app/api/routes/auth.py`). Log in as that user to reach `/admin/*` routes.
- In dev, the active gateway defaults to `mock` (`app/payments/mock_gateway.py`)
  — it always succeeds, so the whole book → pay → confirm flow works with zero
  credentials. Switch gateways via `PUT /admin/payment-settings`.
- Razorpay, Stripe, PayU, and Cashfree are implemented against each
  provider's real REST API (`app/payments/*_gateway.py`) but **need real
  merchant credentials to actually work** — they were verified to make
  genuine API calls (a dummy key correctly gets a real 401 back), but not
  live-tested end-to-end with real money. The Mock gateway is what proves
  the booking/payment/confirmation flow itself is correct.
- Webhook endpoints (`POST /payments/webhook/{gateway}`) need a public HTTPS
  URL to receive real gateway callbacks — not exercisable on localhost
  without a tunnel (e.g. ngrok). The client-side `/payments/verify` call is
  what makes local dev/testing work end-to-end.

## Multi-language

- UI chrome (nav, labels, buttons, form fields) is translatable; dynamic
  content from the backend (blog post bodies, pooja/ritual descriptions,
  tarot meanings, chat messages) is **not** translated — that's
  admin/database content, a separate content-management concern.
- Implementation is a client-side language switcher
  (`apps/web/lib/i18n/LanguageContext.tsx` + `dictionaries/{en,hi,pa,mr,gu}.ts`),
  not locale-prefixed routing (`/hi/...`) — same URL for every language, no
  per-language SEO. Upgrading to `next-intl` + `app/[locale]/` routing is a
  reasonable future refinement if per-language indexable URLs matter.
- **Translation quality**: Hindi should be solid; Punjabi, Marathi and
  Gujarati are reasonable best-effort machine-assisted translations and
  should get a native-speaker review pass before this is genuinely
  production-facing — same honesty as the Vashya-koota disclaimer above.
