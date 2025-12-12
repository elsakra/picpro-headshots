import { NextRequest, NextResponse } from "next/server";
import { uploadFile, generateUploadKey, generateTrainingZipKey, createAndUploadZip, isStorageConfigured } from "@/lib/storage";
import { saveUploadedPhoto, updateOrderStatus, getOrder, saveTempUpload } from "@/lib/db";
import { createTrainingJob, isReplicateConfigured } from "@/lib/replicate";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const orderId = formData.get("orderId") as string;
    const email = formData.get("email") as string;
    const tempUploadId = formData.get("tempUploadId") as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length < 10) {
      return NextResponse.json(
        { error: "Minimum 10 photos required" },
        { status: 400 }
      );
    }

    if (files.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 photos allowed" },
        { status: 400 }
      );
    }

    // Validate file types - Accept HEIC/HEIF too (they should be converted client-side, but accept as fallback)
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    const isValidType = (file: File) => {
      // Check MIME type
      if (validTypes.includes(file.type.toLowerCase())) return true;
      // Also check extension for HEIC files (some browsers don't set correct MIME)
      const ext = file.name.toLowerCase().split('.').pop();
      return ext === 'heic' || ext === 'heif';
    };
    const invalidFiles = files.filter((f) => !isValidType(f));
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and HEIC images are allowed" },
        { status: 400 }
      );
    }

    // If no orderId, this is a pre-checkout upload (store temporarily)
    const effectiveOrderId = orderId || `temp_${Date.now()}`;
    const userId = email || "anonymous";

    // Upload files to storage
    const uploadedPhotos: Array<{ key: string; url: string; filename: string; size: number }> = [];
    const imageBuffers: Array<{ buffer: Buffer; filename: string }> = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = generateUploadKey(userId, effectiveOrderId, file.name);
      
      let url: string;
      if (isStorageConfigured()) {
        url = await uploadFile(buffer, key, file.type);
      } else {
        // Demo mode
        url = `https://demo.storage/${key}`;
      }

      uploadedPhotos.push({
        key,
        url,
        filename: file.name,
        size: file.size,
      });

      imageBuffers.push({
        buffer,
        filename: file.name,
      });

      // Save to database if we have a real order
      if (orderId && !orderId.startsWith("temp_") && !orderId.startsWith("demo_")) {
        await saveUploadedPhoto(orderId, key, file.name, file.size);
      }
    }

    // Create training zip file
    let zipUrl: string;
    const zipKey = generateTrainingZipKey(effectiveOrderId);
    
    if (isStorageConfigured()) {
      zipUrl = await createAndUploadZip(imageBuffers, zipKey);
    } else {
      zipUrl = `https://demo.storage/${zipKey}`;
    }

    // If this is a pre-checkout upload, save the temp upload reference
    if (tempUploadId && !orderId) {
      await saveTempUpload(tempUploadId, zipUrl, uploadedPhotos.length);
    }

    // If we have a real order, start training
    let trainingJob = null;
    if (orderId && !orderId.startsWith("temp_") && !orderId.startsWith("demo_")) {
      // Update order status to training
      await updateOrderStatus(orderId, "training");

      // Start training job
      const webhookUrl = process.env.NEXT_PUBLIC_BASE_URL 
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/replicate-webhook`
        : undefined;

      if (isReplicateConfigured()) {
        trainingJob = await createTrainingJob(zipUrl, webhookUrl);
        
        // Update order with training job ID
        await updateOrderStatus(orderId, "training", {
          training_job_id: trainingJob.trainingId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Photos uploaded successfully",
      photoCount: uploadedPhotos.length,
      photos: uploadedPhotos.map((p) => ({ key: p.key, filename: p.filename })),
      zipUrl,
      tempUploadId: tempUploadId || null,
      trainingJob: trainingJob ? {
        id: trainingJob.trainingId,
        status: trainingJob.status,
      } : null,
      demo: !isStorageConfigured() || !isReplicateConfigured(),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

// Get upload status / job status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { error: "Order ID required" },
      { status: 400 }
    );
  }

  try {
    const order = await getOrder(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      trainingJobId: order.training_job_id,
      modelUrl: order.model_url,
    });
  } catch (error) {
    console.error("Get upload status error:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
