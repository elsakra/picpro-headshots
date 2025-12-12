import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Database types
export interface Order {
  id: string;
  email: string;
  tier: "starter" | "professional" | "executive";
  price: number;
  status: "pending" | "paid" | "training" | "generating" | "completed" | "failed";
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  training_job_id?: string;
  model_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedPhoto {
  id: string;
  order_id: string;
  storage_key: string;
  original_filename: string;
  size_bytes: number;
  created_at: string;
}

export interface GeneratedHeadshot {
  id: string;
  order_id: string;
  style: string;
  storage_key: string;
  storage_url: string;
  generation_job_id?: string;
  created_at: string;
}

export interface GenerationJob {
  id: string;
  order_id: string;
  style: string;
  replicate_prediction_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface TempUpload {
  id: string;
  temp_upload_id: string;
  zip_url: string;
  photo_count: number;
  created_at: string;
}

// Database schema - run this in Supabase SQL editor
export const DATABASE_SCHEMA = `
-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'professional', 'executive')),
  price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'training', 'generating', 'completed', 'failed')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  training_job_id TEXT,
  model_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded photos table
CREATE TABLE IF NOT EXISTS uploaded_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated headshots table
CREATE TABLE IF NOT EXISTS generated_headshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  generation_job_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation jobs table
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  replicate_prediction_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Temporary uploads table (for pre-checkout uploads)
CREATE TABLE IF NOT EXISTS temp_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temp_upload_id TEXT NOT NULL UNIQUE,
  zip_url TEXT NOT NULL,
  photo_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_photos_order ON uploaded_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_generated_headshots_order ON generated_headshots(order_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_order ON generation_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_prediction ON generation_jobs(replicate_prediction_id);
CREATE INDEX IF NOT EXISTS idx_temp_uploads_temp_id ON temp_uploads(temp_upload_id);
CREATE INDEX IF NOT EXISTS idx_orders_training_job ON orders(training_job_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (optional - enable if using Supabase Auth)
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE uploaded_photos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generated_headshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
`;

// Initialize Supabase client
let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase not configured - database features will use demo mode");
    return null;
  }

  console.log("✅ Supabase client initialized:", supabaseUrl);
  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

// Check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!getSupabaseClient();
}

// ============== Order Operations ==============

export async function createOrder(
  email: string,
  tier: Order["tier"],
  price: number,
  stripeSessionId?: string
): Promise<Order> {
  const client = getSupabaseClient();
  
  if (!client) {
    // Demo mode
    const demoOrder: Order = {
      id: `demo_order_${Date.now()}`,
      email,
      tier,
      price,
      status: "pending",
      stripe_session_id: stripeSessionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return demoOrder;
  }

  const { data, error } = await client
    .from("orders")
    .insert({
      email,
      tier,
      price,
      stripe_session_id: stripeSessionId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const client = getSupabaseClient();
  
  if (!client || orderId.startsWith("demo_")) {
    return null;
  }

  const { data, error } = await client
    .from("orders")
    .select()
    .eq("id", orderId)
    .single();

  if (error) return null;
  return data;
}

export async function getOrderByStripeSession(sessionId: string): Promise<Order | null> {
  const client = getSupabaseClient();
  
  if (!client) return null;

  const { data, error } = await client
    .from("orders")
    .select()
    .eq("stripe_session_id", sessionId)
    .single();

  if (error) return null;
  return data;
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const client = getSupabaseClient();
  
  if (!client) return [];

  const { data, error } = await client
    .from("orders")
    .select()
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
  additionalFields?: Partial<Order>
): Promise<Order | null> {
  const client = getSupabaseClient();
  
  if (!client || orderId.startsWith("demo_")) {
    return null;
  }

  const { data, error } = await client
    .from("orders")
    .update({ status, ...additionalFields })
    .eq("id", orderId)
    .select()
    .single();

  if (error) return null;
  return data;
}

// ============== Uploaded Photo Operations ==============

export async function saveUploadedPhoto(
  orderId: string,
  storageKey: string,
  originalFilename: string,
  sizeBytes: number
): Promise<UploadedPhoto> {
  const client = getSupabaseClient();
  
  if (!client || orderId.startsWith("demo_")) {
    return {
      id: `demo_photo_${Date.now()}`,
      order_id: orderId,
      storage_key: storageKey,
      original_filename: originalFilename,
      size_bytes: sizeBytes,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await client
    .from("uploaded_photos")
    .insert({
      order_id: orderId,
      storage_key: storageKey,
      original_filename: originalFilename,
      size_bytes: sizeBytes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUploadedPhotos(orderId: string): Promise<UploadedPhoto[]> {
  const client = getSupabaseClient();
  
  if (!client || orderId.startsWith("demo_")) {
    return [];
  }

  const { data, error } = await client
    .from("uploaded_photos")
    .select()
    .eq("order_id", orderId);

  if (error) return [];
  return data;
}

// ============== Generated Headshot Operations ==============

export async function saveGeneratedHeadshot(
  orderId: string,
  style: string,
  storageKey: string,
  storageUrl: string,
  generationJobId?: string
): Promise<GeneratedHeadshot> {
  const client = getSupabaseClient();
  
  if (!client || orderId.startsWith("demo_")) {
    return {
      id: `demo_headshot_${Date.now()}`,
      order_id: orderId,
      style,
      storage_key: storageKey,
      storage_url: storageUrl,
      generation_job_id: generationJobId,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await client
    .from("generated_headshots")
    .insert({
      order_id: orderId,
      style,
      storage_key: storageKey,
      storage_url: storageUrl,
      generation_job_id: generationJobId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getGeneratedHeadshots(orderId: string): Promise<GeneratedHeadshot[]> {
  const client = getSupabaseClient();
  
  if (!client || orderId.startsWith("demo_")) {
    return [];
  }

  const { data, error } = await client
    .from("generated_headshots")
    .select()
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data;
}

// ============== Generation Job Operations ==============

export async function createGenerationJob(
  orderId: string,
  style: string,
  replicatePredictionId: string
): Promise<GenerationJob> {
  const client = getSupabaseClient();
  
  if (!client || orderId.startsWith("demo_")) {
    return {
      id: `demo_job_${Date.now()}`,
      order_id: orderId,
      style,
      replicate_prediction_id: replicatePredictionId,
      status: "pending",
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await client
    .from("generation_jobs")
    .insert({
      order_id: orderId,
      style,
      replicate_prediction_id: replicatePredictionId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGenerationJob(
  predictionId: string,
  status: GenerationJob["status"],
  error?: string
): Promise<GenerationJob | null> {
  const client = getSupabaseClient();
  
  if (!client) return null;

  const updates: Partial<GenerationJob> = { status };
  if (error) updates.error = error;
  if (status === "completed" || status === "failed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error: dbError } = await client
    .from("generation_jobs")
    .update(updates)
    .eq("replicate_prediction_id", predictionId)
    .select()
    .single();

  if (dbError) return null;
  return data;
}

export async function getGenerationJobs(orderId: string): Promise<GenerationJob[]> {
  const client = getSupabaseClient();
  
  if (!client || orderId.startsWith("demo_")) {
    return [];
  }

  const { data, error } = await client
    .from("generation_jobs")
    .select()
    .eq("order_id", orderId);

  if (error) return [];
  return data;
}

export async function getJobByPredictionId(predictionId: string): Promise<GenerationJob | null> {
  const client = getSupabaseClient();
  
  if (!client) return null;

  const { data, error } = await client
    .from("generation_jobs")
    .select()
    .eq("replicate_prediction_id", predictionId)
    .single();

  if (error) return null;
  return data;
}

// ============== Aggregate Operations ==============

export async function getOrderWithDetails(orderId: string): Promise<{
  order: Order;
  photos: UploadedPhoto[];
  headshots: GeneratedHeadshot[];
  jobs: GenerationJob[];
} | null> {
  const order = await getOrder(orderId);
  if (!order) return null;

  const [photos, headshots, jobs] = await Promise.all([
    getUploadedPhotos(orderId),
    getGeneratedHeadshots(orderId),
    getGenerationJobs(orderId),
  ]);

  return { order, photos, headshots, jobs };
}

// Check if all generation jobs for an order are complete
export async function areAllJobsComplete(orderId: string): Promise<boolean> {
  const jobs = await getGenerationJobs(orderId);
  if (jobs.length === 0) return false;
  return jobs.every((job) => job.status === "completed" || job.status === "failed");
}

// ============== Temp Upload Operations ==============

export async function saveTempUpload(
  tempUploadId: string,
  zipUrl: string,
  photoCount: number
): Promise<TempUpload> {
  const client = getSupabaseClient();
  
  if (!client) {
    // Demo mode - store in memory
    return {
      id: `demo_temp_${Date.now()}`,
      temp_upload_id: tempUploadId,
      zip_url: zipUrl,
      photo_count: photoCount,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await client
    .from("temp_uploads")
    .upsert({
      temp_upload_id: tempUploadId,
      zip_url: zipUrl,
      photo_count: photoCount,
    }, { onConflict: "temp_upload_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTempUpload(tempUploadId: string): Promise<TempUpload | null> {
  const client = getSupabaseClient();
  
  if (!client) return null;

  const { data, error } = await client
    .from("temp_uploads")
    .select()
    .eq("temp_upload_id", tempUploadId)
    .single();

  if (error) return null;
  return data;
}

export async function deleteTempUpload(tempUploadId: string): Promise<void> {
  const client = getSupabaseClient();
  
  if (!client) return;

  await client
    .from("temp_uploads")
    .delete()
    .eq("temp_upload_id", tempUploadId);
}

// ============== Order Lookup by Training Job ==============

export async function getOrderByTrainingJob(trainingJobId: string): Promise<Order | null> {
  const client = getSupabaseClient();
  
  if (!client) return null;

  const { data, error } = await client
    .from("orders")
    .select()
    .eq("training_job_id", trainingJobId)
    .single();

  if (error) return null;
  return data;
}


