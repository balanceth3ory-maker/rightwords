# RightWords

AI-powered communication tools — Statement Builder + Wrong Question conflict diagnostic.

Built with Next.js 14, Supabase, Stripe, and xAI (Grok).

---

## Setup

### 1. Run the Supabase SQL

Go to your Supabase dashboard → SQL Editor → New query.
Paste the contents of `SUPABASE_SETUP.sql` and run it.
This creates your `profiles` and `sessions` tables.

### 2. Add environment variables to Vercel

In your Vercel project → Settings → Environment Variables, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel app URL (e.g. https://rightwords.vercel.app) |
| `XAI_API_KEY` | Your xAI API key |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | From Stripe → Webhooks (see below) |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API → service_role |

### 3. Set up Stripe webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-app.vercel.app/api/stripe/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel

### 4. Deploy

Push to GitHub — Vercel will auto-deploy.

---

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your keys
npm run dev
```

---

## Project structure

```
app/
  page.jsx              — Landing page
  login/page.jsx        — Auth (signup + login)
  dashboard/page.jsx    — User home + session history
  upgrade/page.jsx      — Stripe checkout
  tools/
    statement/page.jsx  — I/XYZ/NVC Statement Builder
    coaching/page.jsx   — Wrong Question conflict diagnostic
  api/
    statement/route.js  — xAI API (statement generation)
    coaching/route.js   — xAI API (conflict coaching)
    stripe/
      checkout/route.js — Create Stripe checkout session
      webhook/route.js  — Handle Stripe payment events
components/
  Nav.jsx               — Sticky navigation
  UsageGate.jsx         — Free tier limit enforcement
lib/
  supabase.js           — Supabase client
  stripe.js             — Stripe client
```
