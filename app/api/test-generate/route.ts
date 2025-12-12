import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    const apiToken = process.env.REPLICATE_API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json(
        { error: "REPLICATE_API_TOKEN not set in environment" },
        { status: 500 }
      );
    }

    console.log("🚀 Starting real AI generation with prompt:", prompt.substring(0, 50) + "...");
    
    const replicate = new Replicate({ auth: apiToken });

    // Use Flux Schnell - fast and good quality
    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 90,
      },
    });

    console.log("✅ Generation complete!");
    
    // Output is an array of URLs or ReadableStream
    let images: string[] = [];
    
    if (Array.isArray(output)) {
      // If it's an array of URLs
      images = output.map((item) => {
        if (typeof item === "string") return item;
        // If it's a ReadableStream, we need to handle it differently
        return String(item);
      });
    }

    return NextResponse.json({
      success: true,
      images,
      model: "black-forest-labs/flux-schnell",
    });
  } catch (error: unknown) {
    console.error("Generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 500 }
    );
  }
}

