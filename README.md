# Avatar Oasis

A marketplace for VRChat avatars: creators upload and sell avatars, buyers get a
secure gated download after checkout, creators get paid out via Stripe Connect
minus a platform fee, homepage placement is sold as limited "featured slots,"
and buyers can request custom commissions from any creator.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Prisma** + SQLite for local dev (swap the datasource to Postgres for production)
- **Stripe** — Checkout for payments, Connect (Express accounts) for creator payouts
- **Custom session auth** — signed JWT in an httpOnly cookie (bcrypt password hashes), no third-party auth library
- **Tailwind CSS v4**

## Getting started

```bash
npm install
npx prisma migrate dev
npm run dev
```

The app runs at http://localhost:3000. A SQLite file (`dev.db`) is created
automatically. Uploaded thumbnails/preview images are saved to `public/uploads`;
the actual avatar package files buyers pay for are saved to `storage/` (outside
`public`, never served directly — see "How downloads stay secure" below).

## Configuring Stripe (required for payments to work)

The `.env` file ships with placeholder Stripe keys so the app boots without
crashing, but checkout, Connect onboarding, and payouts will fail until you add
real **test mode** keys:

1. Create a free Stripe account and grab your test keys from
   https://dashboard.stripe.com/test/apikeys.
2. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`.
3. Enable **Stripe Connect** (Express accounts) in your dashboard —
   https://dashboard.stripe.com/test/connect/accounts/overview — no extra config
   needed for test mode.
4. Forward webhooks to your local server with the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET`.
5. Restart `npm run dev`.

Without a webhook listener running, Stripe Checkout will still redirect the
buyer back to your success page, but the order will stay `PENDING` forever
because nothing ever confirms payment — the webhook is the only thing that
marks an order `COMPLETED` or activates a featured slot. This is deliberate:
see the next section.

## How the secure purchase gateway works

- Avatar package files live in `storage/`, outside `public/`, so there is no
  direct URL to them.
- `POST /api/checkout` creates a Stripe Checkout Session with
  `payment_intent_data.transfer_data.destination` set to the creator's
  connected Stripe account and `application_fee_amount` set to the platform's
  cut. It also writes a `PENDING` `Order` row.
- **Only** the Stripe webhook handler (`/api/webhooks/stripe`, signature
  verified with `STRIPE_WEBHOOK_SECRET`) flips that order to `COMPLETED`. No
  client-side code, redirect, or success page can mark a purchase as paid.
- `GET /api/avatars/[id]/download` checks that the requester is either the
  avatar's creator or has a `COMPLETED` order for it before reading the file
  off disk and streaming it back.

## Platform economics

Configured via `.env`:

- `PLATFORM_FEE_PERCENT` — cut of each avatar sale kept by the platform (rest
  transfers to the creator automatically through Stripe Connect).
- `FEATURED_SLOT_PRICE_CENTS` / `FEATURED_SLOT_DURATION_DAYS` — cost and length
  of a homepage featured placement.
- `FEATURED_SLOT_MAX_ACTIVE` — how many avatars can be featured at once; once
  full, creators see the next slot's opening date instead of being able to buy one.

## Project structure

```
prisma/schema.prisma       Data model (User, Avatar, Order, FeaturedSlot, Commission)
src/lib/                   Session auth, Stripe client, file storage, validation
src/app/api/               Route handlers (auth, avatars, checkout, webhooks, commissions, profile, Connect)
src/app/                   Pages: home, browse, avatar detail, upload, dashboard, profile, commissions, auth
src/components/            Shared UI + client components (forms, purchase/claim buttons)
storage/                   Private avatar package files (gitignored in spirit — not web-accessible)
public/uploads/            Public images (thumbnails, previews, avatars, profile pictures)
```

## Notes for production

- Swap `datasource db { provider = "sqlite" }` in `prisma/schema.prisma` for
  `postgresql` and point `DATABASE_URL` at a real database.
- Swap local file storage (`src/lib/storage.ts`) for S3/R2/GCS — the local
  filesystem won't survive most serverless deployments.
- Set real, non-placeholder values for every secret in `.env` (`AUTH_SECRET`,
  Stripe keys) and never commit `.env`.
