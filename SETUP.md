# PicPro AI - Setup Guide

This guide will help you set up PicPro AI for production. Follow these steps in order.

## Prerequisites

- Node.js 18+ installed
- A domain name (for production)
- Credit card for service signups (all have free tiers)

## Quick Start (Demo Mode)

```bash
# Install dependencies
npm install

# Run in development (demo mode - no credentials needed)
npm run dev

# Open http://localhost:3000
```

The app works in demo mode without any API keys - perfect for testing the UI.

---

## Production Setup

### Step 1: Replicate (AI Generation) - ~5 minutes

Replicate powers the AI headshot generation.

1. Sign up at [replicate.com](https://replicate.com)
2. Go to [Account Settings > API Tokens](https://replicate.com/account/api-tokens)
3. Create a new token and copy it

```env
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Cost**: ~$1-2 per training job, ~$0.01 per image. Free credits for new accounts.

### Step 2: Cloudflare R2 (Storage) - ~10 minutes

R2 stores uploaded photos and generated headshots.

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Go to R2 in the sidebar
3. Create a bucket called `picpro-uploads`
4. Go to **Manage R2 API Tokens** > Create API Token
5. Select "Object Read & Write" permissions
6. Copy the credentials

```env
R2_ENDPOINT=https://xxxxxxxxx.r2.cloudflarestorage.com
R2_BUCKET=picpro-uploads
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_REGION=auto
```

**Optional**: Enable public access for the bucket and set `R2_PUBLIC_URL`.

**Cost**: Free tier includes 10GB storage, 1M reads, 1M writes/month.

### Step 3: Supabase (Database) - ~10 minutes

Supabase stores orders, users, and job data.

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run this schema:

```sql
-- Copy from lib/db.ts DATABASE_SCHEMA constant
-- Or run this:

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'professional', 'executive')),
  price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  training_job_id TEXT,
  model_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploaded_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_headshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  generation_job_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  replicate_prediction_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
```

4. Go to **Project Settings > API** and copy the keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cost**: Free tier includes 500MB database.

### Step 4: Stripe (Payments) - ~15 minutes

Stripe handles payments.

1. Sign up at [stripe.com](https://stripe.com)
2. Go to [API Keys](https://dashboard.stripe.com/apikeys)
3. Copy the Secret Key

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. Create Products:
   - Go to [Products](https://dashboard.stripe.com/products)
   - Create 3 products: Starter ($29), Professional ($49), Executive ($99)
   - Copy the Price IDs (or leave blank to use dynamic pricing)

```env
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxx
STRIPE_PRICE_EXECUTIVE=price_xxxxx
```

5. Set up Webhook:
   - Go to [Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://yourdomain.com/api/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy the Webhook Secret

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**For local testing**, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

### Step 5: Resend (Email) - ~5 minutes

Resend sends transactional emails.

1. Sign up at [resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a key and copy it

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=hello@yourdomain.com
```

4. **For production**: Add and verify your domain in Resend

**Cost**: Free tier includes 100 emails/day.

### Step 6: Analytics (Optional)

#### Meta Pixel
1. Go to [Meta Events Manager](https://business.facebook.com/events_manager)
2. Create a Pixel and copy the ID

```env
NEXT_PUBLIC_META_PIXEL_ID=xxxxxxxxxxxxxxxxx
```

#### Google Analytics
1. Go to [Google Analytics](https://analytics.google.com)
2. Create a property and copy the Measurement ID

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### Google Ads
1. Go to [Google Ads](https://ads.google.com)
2. Set up conversion tracking

```env
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-xxxxxxxxxx
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=xxxxxxxxxxxxxxx
```

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add all environment variables in Project Settings
5. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel --prod
```

### Set Your Domain

```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

---

## Testing the Full Flow

1. **Upload Test**: Go to `/upload` and upload 10+ photos
2. **Checkout Test**: Select a plan and complete payment (use Stripe test card `4242 4242 4242 4242`)
3. **Processing**: Watch the dashboard update as the job processes
4. **Delivery**: Check that email is received when complete
5. **Download**: Verify images can be downloaded

---

## File Structure

```
/app
  /page.tsx                    # Landing page
  /upload/page.tsx             # Photo upload
  /checkout/page.tsx           # Payment
  /dashboard/page.tsx          # Results gallery
  /api
    /checkout/route.ts         # Create Stripe session
    /webhook/route.ts          # Stripe webhooks
    /upload/route.ts           # Handle uploads
    /generate/route.ts         # Start generation
    /order/route.ts            # Get order details
    /replicate-webhook/route.ts # AI callbacks
/lib
  /stripe.ts                   # Stripe utilities
  /replicate.ts                # AI integration
  /storage.ts                  # R2/S3 utilities
  /db.ts                       # Supabase client
  /email.ts                    # Resend emails
  /analytics.ts                # Tracking
  /queue.ts                    # Job queue
```

---

## Cost Breakdown (At Scale)

| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Cloudflare R2 | ~$5-20 |
| Resend | $0-20 |
| Replicate | ~$1-2 per customer |
| **Total Fixed** | ~$50-85/month |
| **Per Customer** | ~$1-2 |

With $49 average order and ~$2 AI cost, gross margin is ~95% (before ads).

---

## Troubleshooting

### "Demo mode" warnings
These appear when API keys aren't set. Set the relevant environment variable.

### Stripe webhook not working
- Check the webhook secret matches
- Ensure the endpoint URL is correct
- For local dev, use Stripe CLI

### Images not uploading
- Verify R2 credentials
- Check bucket permissions
- Ensure file types are allowed (JPEG, PNG, WebP)

### AI generation failing
- Check Replicate API token
- Verify you have credits
- Check the model version is correct

---

## Support

For issues, check:
1. Console logs (browser and server)
2. Supabase logs
3. Stripe webhook logs
4. Replicate dashboard

Good luck building your $1M business! 🚀


