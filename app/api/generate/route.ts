import { NextRequest, NextResponse } from "next/server";
import { 
  generateHeadshots, 
  generateAllHeadshots, 
  HEADSHOT_STYLES, 
  HeadshotStyle,
  isReplicateConfigured,
  getPredictionResult,
} from "@/lib/replicate";
import { 
  getOrder, 
  updateOrderStatus, 
  createGenerationJob, 
  saveGeneratedHeadshot,
  getGeneratedHeadshots,
} from "@/lib/db";
import { uploadFromUrl, generateHeadshotKey } from "@/lib/storage";
import { sendHeadshotsReadyEmail } from "@/lib/email";

// Start headshot generation for an order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, styles, modelUrl } = body as {
      orderId: string;
      styles?: HeadshotStyle[];
      modelUrl?: string;
    };

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get order from database
    const order = await getOrder(orderId);
    if (!order && !orderId.startsWith("demo_")) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Determine which styles to generate based on tier
    const tierStyles: Record<string, HeadshotStyle[]> = {
      starter: ["corporate", "linkedin", "tech", "founder", "creative"],
      professional: ["corporate", "linkedin", "tech", "founder", "creative", "finance", "realEstate", "healthcare", "legal", "academic"],
      executive: Object.keys(HEADSHOT_STYLES) as HeadshotStyle[],
    };

    const selectedStyles = styles || tierStyles[order?.tier || "professional"];
    const effectiveModelUrl = modelUrl || order?.model_url;

    if (!effectiveModelUrl) {
      return NextResponse.json(
        { error: "Model URL not available - training may not be complete" },
        { status: 400 }
      );
    }

    // Determine images per style based on tier
    const imagesPerStyle: Record<string, number> = {
      starter: 8, // 40 total / 5 styles
      professional: 10, // 100 total / 10 styles
      executive: 20, // 200 total / 10 styles
    };

    const numPerStyle = imagesPerStyle[order?.tier || "professional"];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const webhookUrl = `${baseUrl}/api/replicate-webhook`;

    if (!isReplicateConfigured()) {
      // Demo mode - return placeholder images
      const demoResults = selectedStyles.map((style) => ({
        style,
        styleName: HEADSHOT_STYLES[style].name,
        images: Array(numPerStyle).fill(null).map((_, i) => 
          `https://picsum.photos/seed/${style}${i}/1024/1024`
        ),
      }));

      return NextResponse.json({
        demo: true,
        message: "Demo mode - returning placeholder images",
        results: demoResults,
        totalImages: demoResults.reduce((acc, r) => acc + r.images.length, 0),
      });
    }

    // Update order status
    if (order) {
      await updateOrderStatus(orderId, "generating");
    }

    // Start generation jobs for each style
    const jobs = await generateAllHeadshots(
      effectiveModelUrl,
      selectedStyles,
      numPerStyle,
      webhookUrl
    );

    // Save generation jobs to database
    for (const job of jobs.predictions) {
      await createGenerationJob(orderId, job.style, job.predictionId);
    }

    return NextResponse.json({
      success: true,
      message: "Generation started",
      jobs: jobs.predictions,
      totalStyles: selectedStyles.length,
      imagesPerStyle: numPerStyle,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 500 }
    );
  }
}

// Get generation status and results
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const predictionId = searchParams.get("predictionId");

  if (predictionId) {
    // Get single prediction result
    try {
      const result = await getPredictionResult(predictionId);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to get prediction" },
        { status: 500 }
      );
    }
  }

  if (!orderId) {
    // Return available styles
    return NextResponse.json({
      styles: Object.entries(HEADSHOT_STYLES).map(([id, config]) => ({
        id,
        name: config.name,
      })),
    });
  }

  // Get all headshots for an order
  try {
    const headshots = await getGeneratedHeadshots(orderId);
    const order = await getOrder(orderId);

    return NextResponse.json({
      orderId,
      status: order?.status,
      headshots: headshots.map((h) => ({
        id: h.id,
        style: h.style,
        url: h.storage_url,
      })),
      totalCount: headshots.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get headshots" },
      { status: 500 }
    );
  }
}

// Process completed generation (called by webhook or manually)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictionId, orderId, style, imageUrls } = body as {
      predictionId: string;
      orderId: string;
      style: string;
      imageUrls: string[];
    };

    if (!orderId || !style || !imageUrls?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload images to our storage and save to database
    const savedHeadshots = [];
    for (let i = 0; i < imageUrls.length; i++) {
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
    }

    // Check if all styles are complete
    const order = await getOrder(orderId);
    if (order) {
      const allHeadshots = await getGeneratedHeadshots(orderId);
      const uniqueStyles = new Set(allHeadshots.map((h) => h.style));
      
      // Determine expected styles based on tier
      const expectedStyleCount: Record<string, number> = {
        starter: 5,
        professional: 10,
        executive: 10,
      };

      if (uniqueStyles.size >= expectedStyleCount[order.tier]) {
        // All styles complete - update order and send email
        await updateOrderStatus(orderId, "completed");
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        await sendHeadshotsReadyEmail(
          order.email,
          `${baseUrl}/dashboard?order=${orderId}`,
          allHeadshots.length
        );
      }
    }

    return NextResponse.json({
      success: true,
      savedCount: savedHeadshots.length,
    });
  } catch (error) {
    console.error("Process generation error:", error);
    return NextResponse.json(
      { error: "Failed to process generation" },
      { status: 500 }
    );
  }
}
