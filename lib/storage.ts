import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if storage is configured
export function isStorageConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Upload file to Cloudinary
export async function uploadFile(
  fileBuffer: Buffer | Uint8Array,
  key: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  if (!isStorageConfigured()) {
    console.warn("Cloudinary not configured - using demo mode");
    return `https://demo.storage/${key}`;
  }

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: key.replace(/\.[^.]+$/, ""), // Remove extension
          folder: "picpro",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error("No result from Cloudinary"));
        }
      );
      
      uploadStream.end(Buffer.from(fileBuffer));
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

// Upload file from URL
export async function uploadFromUrl(
  sourceUrl: string,
  key: string
): Promise<string> {
  if (!isStorageConfigured()) {
    return `https://demo.storage/${key}`;
  }

  try {
    const result = await cloudinary.uploader.upload(sourceUrl, {
      public_id: key.replace(/\.[^.]+$/, ""),
      folder: "picpro",
      resource_type: "auto",
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload from URL error:", error);
    throw error;
  }
}

// Get signed URL for download (Cloudinary URLs are public by default)
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!isStorageConfigured()) {
    return `https://demo.storage/${key}?expires=${expiresIn}`;
  }

  // Generate a signed URL with expiration
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  
  return cloudinary.url(key, {
    secure: true,
    sign_url: true,
    type: "authenticated",
  });
}

// Create a zip archive from multiple images and upload
export async function createAndUploadZip(
  images: Array<{ buffer: Buffer; filename: string }>,
  zipKey: string
): Promise<string> {
  // Dynamic import of archiver
  const archiver = (await import("archiver")).default;
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    const archive = archiver("zip", {
      zlib: { level: 5 },
    });

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", async () => {
      try {
        const zipBuffer = Buffer.concat(chunks);
        const url = await uploadFile(zipBuffer, zipKey, "application/zip");
        resolve(url);
      } catch (error) {
        reject(error);
      }
    });
    archive.on("error", reject);

    // Add all images to the archive
    for (const image of images) {
      archive.append(image.buffer, { name: image.filename });
    }

    archive.finalize();
  });
}

// Create zip from URLs and upload
export async function createZipFromUrls(
  imageUrls: string[],
  zipKey: string
): Promise<string> {
  const images: Array<{ buffer: Buffer; filename: string }> = [];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const response = await fetch(imageUrls[i]);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const ext = imageUrls[i].includes(".png") ? "png" : 
                   imageUrls[i].includes(".jpg") || imageUrls[i].includes(".jpeg") ? "jpg" : "webp";
        images.push({
          buffer,
          filename: `image_${String(i + 1).padStart(3, "0")}.${ext}`,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch image ${i}:`, error);
    }
  }

  if (images.length === 0) {
    throw new Error("No images could be fetched");
  }

  return createAndUploadZip(images, zipKey);
}

// Delete files from Cloudinary
export async function deleteFiles(publicIds: string[]): Promise<void> {
  if (!isStorageConfigured() || publicIds.length === 0) {
    return;
  }

  try {
    await cloudinary.api.delete_resources(publicIds.map(id => `picpro/${id}`));
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
}

// List files with a prefix
export async function listFiles(prefix: string): Promise<string[]> {
  if (!isStorageConfigured()) {
    return [];
  }

  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: `picpro/${prefix}`,
      max_results: 500,
    });

    return result.resources.map((r: { public_id: string }) => r.public_id);
  } catch (error) {
    console.error("Cloudinary list error:", error);
    return [];
  }
}

// Generate unique key for user uploads
export function generateUploadKey(
  userId: string,
  orderId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const ext = filename.split(".").pop() || "jpg";
  return `uploads/${userId}/${orderId}/${timestamp}_${Math.random().toString(36).slice(2)}.${ext}`;
}

// Generate key for generated headshots
export function generateHeadshotKey(
  orderId: string,
  style: string,
  index: number
): string {
  return `headshots/${orderId}/${style}/${String(index).padStart(3, "0")}`;
}

// Generate key for training zip
export function generateTrainingZipKey(orderId: string): string {
  return `training/${orderId}/images`;
}
