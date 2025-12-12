"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  X,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ImagePlus,
  Camera,
  Sun,
  Smile,
  RotateCcw,
  Loader2,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "success" | "error" | "converting";
}

const MIN_PHOTOS = 10;
const MAX_PHOTOS = 20;
const RECOMMENDED_PHOTOS = 15;

const photoTips = [
  { icon: Camera, title: "Clear photos", description: "Well-lit, in-focus shots" },
  { icon: Sun, title: "Natural light", description: "Avoid harsh shadows" },
  { icon: Smile, title: "Varied expressions", description: "Smile, neutral, serious" },
  { icon: RotateCcw, title: "Different angles", description: "Front, 3/4, profile" },
];

// Check if file is HEIC/HEIF format
function isHeicFile(file: File): boolean {
  const heicTypes = ["image/heic", "image/heif"];
  const heicExtensions = [".heic", ".heif"];
  
  if (heicTypes.includes(file.type.toLowerCase())) {
    return true;
  }
  
  const fileName = file.name.toLowerCase();
  return heicExtensions.some(ext => fileName.endsWith(ext));
}

// Convert HEIC to JPEG
async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const heic2anyModule = await import("heic2any");
    const converter = heic2anyModule.default;
    
    const blob = await converter({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
    
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;
    
    const newFileName = file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");
    const convertedFile = new File([resultBlob], newFileName, { 
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    
    return convertedFile;
  } catch (error) {
    console.error("HEIC conversion error:", error);
    throw new Error(`Failed to convert ${file.name}. Please try a different image.`);
  }
}

export default function UploadPage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [showTips, setShowTips] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/") || isHeicFile(file)
      );
      handleFiles(files);
    },
    []
  );

  const handleFiles = async (files: File[]) => {
    const remainingSlots = MAX_PHOTOS - images.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    const heicFiles = filesToAdd.filter(isHeicFile);
    const regularFiles = filesToAdd.filter(f => !isHeicFile(f));
    
    // Add regular files immediately
    const regularImages: UploadedImage[] = regularFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: "success" as const,
    }));
    
    if (regularImages.length > 0) {
      setImages((prev) => [...prev, ...regularImages]);
    }
    
    // Convert HEIC files
    if (heicFiles.length > 0) {
      setIsConverting(true);
      setConversionStatus(`Converting ${heicFiles.length} iPhone photo${heicFiles.length > 1 ? 's' : ''}...`);
      
      for (let i = 0; i < heicFiles.length; i++) {
        const file = heicFiles[i];
        setConversionStatus(`Converting photo ${i + 1} of ${heicFiles.length}...`);
        
        try {
          const convertedFile = await convertHeicToJpeg(file);
          const newImage: UploadedImage = {
            id: Math.random().toString(36).substring(7),
            file: convertedFile,
            preview: URL.createObjectURL(convertedFile),
            status: "success",
          };
          setImages((prev) => [...prev, newImage]);
        } catch (error) {
          console.error(`Failed to convert ${file.name}:`, error);
          const errorImage: UploadedImage = {
            id: Math.random().toString(36).substring(7),
            file,
            preview: "",
            status: "error",
          };
          setImages((prev) => [...prev, errorImage]);
        }
      }
      
      setIsConverting(false);
      setConversionStatus("");
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleContinue = async () => {
    if (images.length < MIN_PHOTOS) return;

    setIsProcessing(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Create a temporary upload ID to track this upload session
      const tempUploadId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Upload photos to server
      const formData = new FormData();
      const successfulImages = images.filter((img) => img.status === "success");
      
      for (const image of successfulImages) {
        formData.append("files", image.file);
      }
      formData.append("tempUploadId", tempUploadId);

      setUploadProgress(10);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadProgress(100);

      // Store the upload reference for checkout to use
      const uploadData = {
        tempUploadId,
        photoCount: successfulImages.length,
        zipUrl: data.zipUrl,
        uploadedAt: new Date().toISOString(),
      };
      localStorage.setItem("uploadedPhotosData", JSON.stringify(uploadData));
      
      // Also store basic photo info for display purposes
      const imageData = successfulImages.map((img) => ({
        id: img.id,
        name: img.file.name,
        size: img.file.size,
      }));
      localStorage.setItem("uploadedPhotos", JSON.stringify(imageData));

      // Navigate to checkout
      router.push("/checkout");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to upload photos. Please try again.");
      setIsProcessing(false);
    }
  };

  const progress = (images.length / RECOMMENDED_PHOTOS) * 100;
  const canContinue = images.length >= MIN_PHOTOS;

  return (
    <div className="min-h-screen bg-background bg-noise">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">PicPro AI</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">1</span>
                <span>Upload</span>
                <ArrowRight className="w-4 h-4 mx-2" />
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center">2</span>
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4 mx-2" />
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center">3</span>
                <span>Download</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Upload Your Photos</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Upload {MIN_PHOTOS}-{MAX_PHOTOS} clear photos of yourself. The more variety, the better your AI headshots will be.
            </p>
          </motion.div>

          {/* Progress indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  {images.length} of {RECOMMENDED_PHOTOS} photos
                  <span className="text-xs ml-1">(min {MIN_PHOTOS})</span>
                </span>
                {isConverting ? (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {conversionStatus}
                  </span>
                ) : canContinue ? (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Ready to continue
                  </span>
                ) : null}
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
            </Card>
          </motion.div>

          {/* Photo tips - collapsible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium">Photo Tips for Best Results</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showTips ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showTips && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/20 rounded-b-xl border-x border-b border-border/30">
                    {photoTips.map((tip, index) => (
                      <div key={index} className="flex flex-col items-center text-center p-3 rounded-lg bg-background/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <tip.icon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs font-medium mb-0.5">{tip.title}</p>
                        <p className="text-xs text-muted-foreground">{tip.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Upload area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className={`relative border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/50 hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={images.length >= MAX_PHOTOS || isConverting}
              />

              {images.length === 0 ? (
                <div className="p-12 md:p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Drag & drop your photos here
                  </h3>
                  <p className="text-muted-foreground mb-5">
                    or click to browse from your device
                  </p>
                  <Button variant="outline" size="lg">
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Select Photos
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supports JPEG, PNG, HEIC (iPhone photos)
                  </p>
                </div>
              ) : (
                <div className="p-5">
                  {/* Image grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    <AnimatePresence mode="popLayout">
                      {images.map((image, index) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          layout
                          className="relative aspect-square group"
                        >
                          {image.status === "success" ? (
                            <img
                              src={image.preview}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Skeleton className="w-full h-full rounded-lg" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(image.id);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {image.status === "success" && (
                            <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Add more placeholder */}
                    {images.length < MAX_PHOTOS && (
                      <div className="aspect-square rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Add more</span>
                      </div>
                    )}
                  </div>

                  {/* Status bar */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                    <span className="text-sm text-muted-foreground">
                      {images.length} photo{images.length !== 1 ? "s" : ""} selected
                    </span>
                    {images.length < MIN_PHOTOS && (
                      <span className="text-sm text-amber-500 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Add {MIN_PHOTOS - images.length} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Upload Progress */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Uploading photos...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </Card>
            </motion.div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Card className="p-4 border-destructive/50 bg-destructive/5">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{uploadError}</span>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-6"
          >
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>

            <Button
              onClick={handleContinue}
              disabled={!canContinue || isProcessing || isConverting}
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  Continue to Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>

          {/* Security note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-muted-foreground mt-8"
          >
            Your photos are processed securely and deleted after generation.
            We never share your images with third parties.
          </motion.p>
        </div>
      </main>
    </div>
  );
}
