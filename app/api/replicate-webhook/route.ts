import { NextRequest, NextResponse } from "next/server";
import { 
  updateOrderStatus, 
  updateGenerationJob,
  getJobByPredictionId,
  getOrder,
  saveGeneratedHeadshot,
  getGeneratedHeadshots,
  areAllJobsComplete,
  getOrderByTrainingJob,
  createGenerationJob,
} from "@/lib/db";
import { uploadFromUrl, generateHeadshotKey } from "@/lib/storage";
import { sendHeadshotsReadyEmail } from "@/lib/email";
import { generateHeadshots, HEADSHOT_STYLES, HeadshotStyle } from "@/lib/replicate";

// Replicate webhook payload types
interface ReplicateWebhook {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | Record<string, unknown>;
  error?: string;
  logs?: string;
  input?: Record<string, unknown>;
  metrics?: {
    predict_time?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReplicateWebhook;
    
    console.log("Replicate webhook received:", {
      id: body.id,
      status: body.status,
      hasOutput: !!body.output,
    });

    const predictionId = body.id;
    const status = body.status;

    if (status === "succeeded") {
      const output = body.output;
      
      // Check if this is a training job (output has weights)
      if (typeof output === "object" && output !== null && "weights" in output) {
        await handleTrainingComplete(predictionId, output as { weights: string; version?: string });
      } 
      // Check if this is a generation job (output is array of image URLs)
      else if (Array.isArray(output)) {
        await handleGenerationComplete(predictionId, output as string[]);
      }
    } else if (status === "failed") {
      console.error("Replicate job failed:", predictionId, body.error);
      
      // Update generation job status if this is a generation job
      await updateGenerationJob(predictionId, "failed", body.error);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Replicate webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleTrainingComplete(
  predictionId: string, 
  output: { weights: string; version?: string }
) {
  console.log("Training completed:", predictionId);
  console.log("Model weights URL:", output.weights);

  // Find the order by training job ID
  const order = await getOrderByTrainingJob(predictionId);
  
  if (!order) {
    console.warn("Order not found for training job:", predictionId);
    return;
  }

  console.log("Found order for training:", order.id, "tier:", order.tier);

  // Update order with model URL and status
  await updateOrderStatus(order.id, "generating", {
    model_url: output.weights,
  });

  // Determine which styles to generate based on tier
  const tierStyles: Record<string, HeadshotStyle[]> = {
    starter: ["corporate", "tech", "creative", "linkedin", "founder"],
    professional: ["corporate", "tech", "creative", "finance", "realEstate", "healthcare", "legal", "academic", "linkedin", "founder"],
    executive: ["corporate", "tech", "creative", "finance", "realEstate", "healthcare", "legal", "academic", "linkedin", "founder"],
  };

  const stylesToGenerate = tierStyles[order.tier] || tierStyles.professional;
  
  // Determine images per style based on tier
  const imagesPerStyle: Record<string, number> = {
    starter: 8,
    professional: 10,
    executive: 20,
  };

  const numPerStyle = imagesPerStyle[order.tier] || 10;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/replicate-webhook`;

  console.log("Starting generation for", stylesToGenerate.length, "styles,", numPerStyle, "images each");

  // Start generation jobs for each style
  for (const style of stylesToGenerate) {
    try {
      const result = await generateHeadshots(output.weights, style, numPerStyle, webhookUrl);
      
      if (typeof result === "object" && "predictionId" in result) {
        // Save the generation job to database
        await createGenerationJob(order.id, style, result.predictionId);
        console.log("Generation job started:", style, result.predictionId);
      }
    } catch (error) {
      console.error(`Failed to start generation for style ${style}:`, error);
    }
  }

  console.log("All generation jobs started for order:", order.id);
}

async function handleGenerationComplete(
  predictionId: string, 
  imageUrls: string[]
) {
  console.log("Generation completed:", predictionId, "Images:", imageUrls.length);

  // Find the generation job
  const job = await getJobByPredictionId(predictionId);
  if (!job) {
    console.warn("Generation job not found for prediction:", predictionId);
    return;
  }

  const orderId = job.order_id;
  const style = job.style;

  // Upload images to our storage
  const savedHeadshots = [];
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const key = generateHeadshotKey(orderId, style, i);
      const url = await uploadFromUrl(imageUrls[i], key);
      
      const headshot = await saveGeneratedHeadshot(
        orderId,
        style,
        key,
        url,
        predictionId
      );
      savedHeadshots.push(headshot);
    } catch (error) {
      console.error(`Failed to save headshot ${i}:`, error);
    }
  }

  // Update job status
  await updateGenerationJob(predictionId, "completed");

  // Check if all jobs are complete
  const allComplete = await areAllJobsComplete(orderId);
  
  if (allComplete) {
    // Update order status
    await updateOrderStatus(orderId, "completed");

    // Get order details and send email
    const order = await getOrder(orderId);
    if (order) {
      const allHeadshots = await getGeneratedHeadshots(orderId);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      
      await sendHeadshotsReadyEmail(
        order.email,
        `${baseUrl}/dashboard?order=${orderId}`,
        allHeadshots.length
      );

      console.log("Order complete, email sent:", orderId);
    }
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    service: "replicate-webhook",
    timestamp: new Date().toISOString(),
  });
}
