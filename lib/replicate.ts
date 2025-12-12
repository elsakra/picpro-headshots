import Replicate from "replicate";

// Debug: Log whether the API token is configured
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
console.log("🔑 REPLICATE_API_TOKEN configured:", !!REPLICATE_TOKEN, REPLICATE_TOKEN ? `(${REPLICATE_TOKEN.substring(0, 8)}...)` : "");

if (!REPLICATE_TOKEN) {
  console.warn("⚠️ Warning: REPLICATE_API_TOKEN is not set - AI features will use demo mode");
}

export const replicate = new Replicate({
  auth: REPLICATE_TOKEN || "",
});

// Check if Replicate is configured
export function isReplicateConfigured(): boolean {
  const configured = !!REPLICATE_TOKEN;
  console.log("🔍 isReplicateConfigured() called, result:", configured);
  return configured;
}

// Professional headshot styles with optimized prompts for Flux
export const HEADSHOT_STYLES = {
  corporate: {
    name: "Corporate Executive",
    prompt: "professional corporate headshot portrait photo of TOK, wearing formal business attire suit, clean neutral gray background, soft studio lighting, confident friendly expression, sharp focus, 8k, professional photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly",
  },
  tech: {
    name: "Tech Startup",
    prompt: "professional headshot portrait photo of TOK, smart casual attire, modern minimalist background, natural soft lighting, approachable confident smile, silicon valley tech style, 8k professional photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly",
  },
  creative: {
    name: "Creative Professional",
    prompt: "artistic professional headshot portrait photo of TOK, creative industry style, dramatic lighting with soft shadows, unique artistic angle, expressive confident look, modern aesthetic, 8k photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly",
  },
  finance: {
    name: "Finance & Banking",
    prompt: "professional finance executive headshot portrait photo of TOK, formal navy or charcoal suit, conservative elegant style, trustworthy authoritative expression, premium studio lighting, 8k professional photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly, casual",
  },
  realEstate: {
    name: "Real Estate",
    prompt: "professional real estate agent headshot portrait photo of TOK, friendly warm approachable smile, business casual attire, bright warm lighting, trustworthy welcoming expression, 8k professional photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly, unfriendly",
  },
  healthcare: {
    name: "Healthcare",
    prompt: "professional healthcare medical headshot portrait photo of TOK, clean clinical appearance, caring compassionate expression, bright clean lighting, trustworthy professional look, 8k photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly",
  },
  legal: {
    name: "Legal Professional",
    prompt: "professional lawyer attorney headshot portrait photo of TOK, formal suit, authoritative yet approachable expression, traditional prestigious style, high quality studio portrait, 8k professional photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly, casual",
  },
  academic: {
    name: "Academic",
    prompt: "professional academic professor headshot portrait photo of TOK, scholarly intelligent appearance, warm approachable expression, university professional style, soft natural lighting, 8k photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly",
  },
  linkedin: {
    name: "LinkedIn Optimized",
    prompt: "professional LinkedIn profile headshot portrait photo of TOK, friendly confident genuine smile, clean simple background, perfect for social media, approachable business professional, 8k photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly, bad lighting",
  },
  founder: {
    name: "Startup Founder",
    prompt: "modern startup founder CEO headshot portrait photo of TOK, confident visionary expression, contemporary entrepreneurial style, tech leader aesthetic, inspiring presence, 8k professional photography",
    negativePrompt: "cartoon, illustration, painting, drawing, blurry, distorted, disfigured, bad anatomy, ugly, boring",
  },
} as const;

export type HeadshotStyle = keyof typeof HEADSHOT_STYLES;

// Training configuration for Flux LoRA fine-tuning
export interface TrainingConfig {
  trigger_word: string;
  steps: number;
  lora_rank: number;
  optimizer: string;
  batch_size: number;
  resolution: string;
  autocaption: boolean;
  autocaption_prefix: string;
}

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  trigger_word: "TOK",
  steps: 1000,
  lora_rank: 16,
  optimizer: "adamw8bit",
  batch_size: 1,
  resolution: "512,768,1024",
  autocaption: true,
  autocaption_prefix: "a photo of TOK, ",
};

// Model versions
const FLUX_TRAINER = "ostris/flux-dev-lora-trainer:4ffd32160efd92e956d39c5338a9b8fbafca58e03f791f6d8011f3e20e8ea6fa";
const FLUX_DEV_LORA = "lucataco/flux-dev-lora:a22c463f11808638ad5e2ebd582e07a469031f48dd567366fb4c6fdab91d614d";

// Create a fine-tuning training job using Flux LoRA trainer
export async function createTrainingJob(
  zipUrl: string,
  webhookUrl?: string
): Promise<{ trainingId: string; status: string }> {
  if (!isReplicateConfigured()) {
    console.log("Demo mode: Would create training job with", zipUrl);
    return {
      trainingId: `demo_training_${Date.now()}`,
      status: "demo",
    };
  }

  try {
    const prediction = await replicate.predictions.create({
      version: FLUX_TRAINER,
      input: {
        input_images: zipUrl,
        ...DEFAULT_TRAINING_CONFIG,
      },
      webhook: webhookUrl,
      webhook_events_filter: ["completed"],
    });

    return {
      trainingId: prediction.id,
      status: prediction.status,
    };
  } catch (error) {
    console.error("Training job creation error:", error);
    throw error;
  }
}

// Check training/prediction status
export async function getTrainingStatus(trainingId: string) {
  if (!isReplicateConfigured() || trainingId.startsWith("demo_")) {
    return {
      status: "succeeded",
      output: { version: "demo_model_v1", weights: "https://demo.replicate.com/weights.safetensors" },
      error: null,
      logs: "Demo mode - training simulated",
    };
  }

  try {
    const prediction = await replicate.predictions.get(trainingId);
    return {
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      logs: prediction.logs,
    };
  } catch (error) {
    console.error("Training status error:", error);
    throw error;
  }
}

// Generate headshots using a fine-tuned LoRA model
export async function generateHeadshots(
  loraUrl: string, // URL to the trained LoRA weights
  style: HeadshotStyle,
  numImages: number = 4,
  webhookUrl?: string
): Promise<string[] | { predictionId: string; status: string }> {
  const styleConfig = HEADSHOT_STYLES[style];

  if (!isReplicateConfigured() || loraUrl.includes("demo")) {
    console.log("Demo mode: Would generate headshots with style", style);
    return Array(numImages).fill(null).map((_, i) => 
      `https://picsum.photos/seed/${style}${i}/1024/1024`
    );
  }

  try {
    // For async generation with webhook
    if (webhookUrl) {
      const prediction = await replicate.predictions.create({
        version: FLUX_DEV_LORA,
        input: {
          prompt: styleConfig.prompt,
          negative_prompt: styleConfig.negativePrompt,
          hf_lora: loraUrl,
          num_outputs: numImages,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          output_format: "webp",
          output_quality: 90,
        },
        webhook: webhookUrl,
        webhook_events_filter: ["completed"],
      });

      return {
        predictionId: prediction.id,
        status: prediction.status,
      };
    }

    // Synchronous generation (blocking)
    const output = await replicate.run(FLUX_DEV_LORA as `${string}/${string}:${string}`, {
      input: {
        prompt: styleConfig.prompt,
        negative_prompt: styleConfig.negativePrompt,
        hf_lora: loraUrl,
        num_outputs: numImages,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        output_format: "webp",
        output_quality: 90,
      },
    });

    return output as string[];
  } catch (error) {
    console.error("Generation error:", error);
    throw error;
  }
}

// Generate all headshots for an order (multiple styles)
export async function generateAllHeadshots(
  loraUrl: string,
  styles: HeadshotStyle[],
  imagesPerStyle: number = 10,
  webhookUrl?: string
): Promise<{ predictions: Array<{ style: HeadshotStyle; predictionId: string }> }> {
  const predictions: Array<{ style: HeadshotStyle; predictionId: string }> = [];

  for (const style of styles) {
    const result = await generateHeadshots(loraUrl, style, imagesPerStyle, webhookUrl);
    
    if (typeof result === "object" && "predictionId" in result) {
      predictions.push({ style, predictionId: result.predictionId });
    }
  }

  return { predictions };
}

// Cancel a running prediction
export async function cancelPrediction(predictionId: string): Promise<void> {
  if (!isReplicateConfigured()) return;
  
  try {
    await replicate.predictions.cancel(predictionId);
  } catch (error) {
    console.error("Cancel prediction error:", error);
  }
}

// Get prediction result
export async function getPredictionResult(predictionId: string) {
  if (!isReplicateConfigured() || predictionId.startsWith("demo_")) {
    return {
      status: "succeeded",
      output: Array(4).fill(null).map((_, i) => 
        `https://picsum.photos/seed/${predictionId}${i}/1024/1024`
      ),
    };
  }

  try {
    const prediction = await replicate.predictions.get(predictionId);
    return {
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
    };
  } catch (error) {
    console.error("Get prediction error:", error);
    throw error;
  }
}
