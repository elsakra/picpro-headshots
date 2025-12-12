# Agent Notes - PicPro AI Headshot Generator

## Project Overview
This is an AI-powered professional headshot generator built with Next.js 14, Replicate (Flux LoRA), Supabase, Stripe, and R2/S3 storage.

## Recent Changes (December 12, 2025)

### Bug Fix: Photos Not Generating Real Images

**Problem:** Users uploaded photos and paid, but the results page showed demo/placeholder images instead of their actual AI-generated headshots.

**Root Causes Identified:**
1. Photos were stored in localStorage but never uploaded to the server
2. `handleTrainingComplete` webhook handler was incomplete (just TODOs)
3. Dashboard silently fell back to demo data on any error

### Fixes Implemented

#### 1. Photo Upload Flow (Fixed)
**Files changed:**
- `app/upload/page.tsx` - Now uploads photos to `/api/upload` before checkout
- `app/api/upload/route.ts` - Added `tempUploadId` support for pre-checkout uploads
- `app/checkout/page.tsx` - Passes `tempUploadId` to checkout API
- `app/api/checkout/route.ts` - Stores `tempUploadId` in Stripe session metadata
- `app/api/webhook/route.ts` - After payment, retrieves temp upload and starts training

**New Flow:**
```
1. User uploads photos → Photos sent to server with tempUploadId
2. User goes to checkout → tempUploadId passed to Stripe session metadata
3. User pays → Stripe webhook retrieves temp upload → Training starts automatically
4. Training completes → Generation jobs start for all styles
5. Generation completes → Headshots saved to database
6. Dashboard displays real headshots
```

#### 2. Training Webhook Handler (Fixed)
**File:** `app/api/replicate-webhook/route.ts`

The `handleTrainingComplete` function now:
- Looks up order by `training_job_id` using `getOrderByTrainingJob()`
- Saves the model URL to the order
- Determines styles based on tier (starter: 5 styles, professional/executive: 10 styles)
- Starts generation jobs for each style
- Updates order status to "generating"

#### 3. Database Functions (Added)
**File:** `lib/db.ts`

New functions:
- `TempUpload` interface
- `saveTempUpload(tempUploadId, zipUrl, photoCount)` - Store temporary uploads
- `getTempUpload(tempUploadId)` - Retrieve temp upload by ID  
- `deleteTempUpload(tempUploadId)` - Clean up after payment
- `getOrderByTrainingJob(trainingJobId)` - Find order by training job ID

#### 4. Dashboard Error Handling (Fixed)
**File:** `app/dashboard/page.tsx`

- Added proper `error` state instead of silent fallback to demo data
- Shows clear error messages with "Try Again" and "Start New Order" buttons
- Only shows demo data when explicitly in demo mode (`?demo=true`)

### Database Migration Required

Run this SQL in Supabase SQL editor:

```sql
-- Temporary uploads table (for pre-checkout uploads)
CREATE TABLE IF NOT EXISTS temp_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temp_upload_id TEXT NOT NULL UNIQUE,
  zip_url TEXT NOT NULL,
  photo_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_temp_uploads_temp_id ON temp_uploads(temp_upload_id);
CREATE INDEX IF NOT EXISTS idx_orders_training_job ON orders(training_job_id);
```

## Architecture Overview

### User Flow
```
/upload → /checkout → Stripe Payment → /dashboard
   ↓           ↓            ↓              ↓
Photos      tempUploadId  Webhook      Shows status/
uploaded    in metadata   triggers     headshots
to server                 training
```

### Backend Flow
```
1. POST /api/upload
   - Uploads photos to R2/S3
   - Creates training zip
   - Saves tempUpload to database
   - Returns zipUrl and tempUploadId

2. POST /api/checkout
   - Creates Stripe session with tempUploadId in metadata
   - Returns Stripe checkout URL

3. POST /api/webhook (Stripe)
   - On checkout.session.completed:
     - Retrieves tempUpload by tempUploadId
     - Starts training job with zipUrl
     - Updates order status to "training"
     - Deletes tempUpload

4. POST /api/replicate-webhook
   - On training succeeded:
     - Finds order by training_job_id
     - Saves model_url to order
     - Starts generation jobs for all styles
     - Updates order status to "generating"
   
   - On generation succeeded:
     - Uploads generated images to storage
     - Saves headshots to database
     - When all styles complete: updates order to "completed"
     - Sends email notification

5. GET /api/order
   - Returns order with headshots for dashboard
```

### Key Environment Variables
```
REPLICATE_API_TOKEN - For AI training/generation
NEXT_PUBLIC_SUPABASE_URL - Database
SUPABASE_SERVICE_ROLE_KEY - Database admin access
STRIPE_SECRET_KEY - Payments
STRIPE_WEBHOOK_SECRET - Webhook verification
R2_ACCESS_KEY_ID - Storage
R2_SECRET_ACCESS_KEY - Storage
R2_BUCKET_NAME - Storage bucket
R2_ENDPOINT - R2 endpoint URL
NEXT_PUBLIC_BASE_URL - For webhook URLs
```

## Deployment

The app is designed to deploy on Vercel. After pushing to GitHub:
1. Import repo to Vercel
2. Add all environment variables
3. Deploy
4. Update Stripe webhook URL to production URL
5. Run database migration in Supabase

## GitHub Repository
- **URL:** https://github.com/elsakra/get_rich_test_2
- **Branch:** main

## Testing Locally

1. Copy `env.example` to `.env.local` and fill in values
2. Run `npm install`
3. Run `npm run dev`
4. Use Stripe CLI for webhook testing: `stripe listen --forward-to localhost:3000/api/webhook`

## Known Issues / TODOs

1. Need to run database migration for `temp_uploads` table
2. Email sending requires Resend API key configuration
3. For production, ensure `NEXT_PUBLIC_BASE_URL` is set correctly for webhook URLs

## Commit History
- `93337c0` - Fix photo upload and generation pipeline (current)

