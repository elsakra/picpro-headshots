"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkeletonGrid, Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Download,
  Check,
  Clock,
  Zap,
  Image as ImageIcon,
  Grid3X3,
  LayoutGrid,
  RefreshCw,
  ExternalLink,
  Mail,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Headshot {
  id: string;
  style: string;
  styleName: string;
  url: string;
}

interface OrderData {
  order: {
    id: string;
    email: string;
    tier: string;
    status: string;
    created_at: string;
  };
  headshots: Array<{
    id: string;
    style: string;
    storage_url: string;
  }>;
}

const STYLE_NAMES: Record<string, string> = {
  corporate: "Corporate Executive",
  tech: "Tech Startup",
  creative: "Creative Professional",
  finance: "Finance & Banking",
  realEstate: "Real Estate",
  healthcare: "Healthcare",
  legal: "Legal Professional",
  academic: "Academic",
  linkedin: "LinkedIn Optimized",
  founder: "Startup Founder",
};

function generateDemoHeadshots(): Headshot[] {
  const styles = ["corporate", "tech", "creative", "linkedin", "founder"];
  return styles.flatMap((style) =>
    Array(10)
      .fill(null)
      .map((_, i) => ({
        id: `${style}-${i}`,
        style,
        styleName: STYLE_NAMES[style] || style,
        url: `https://images.unsplash.com/photo-${1560250097 + i * 1000}-0b93528c311a?w=400&h=500&fit=crop&crop=face`,
      }))
  );
}

type ViewMode = "grid" | "large";
type OrderStatus = "pending" | "paid" | "training" | "generating" | "completed" | "failed";

function DashboardContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const sessionId = searchParams.get("session_id");
  const isDemo = searchParams.get("demo") === "true";
  const isSuccess = searchParams.get("success") === "true";

  const [status, setStatus] = useState<OrderStatus>(isDemo ? "completed" : "pending");
  const [progress, setProgress] = useState(0);
  const [headshots, setHeadshots] = useState<Headshot[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderData = useCallback(async () => {
    if (isDemo) {
      setHeadshots(generateDemoHeadshots());
      setAvailableStyles(["corporate", "tech", "creative", "linkedin", "founder"]);
      setStatus("completed");
      setIsLoading(false);
      setError(null);
      return;
    }

    // If no order ID or session ID, show error
    if (!orderId && !sessionId) {
      setError("No order found. Please check your email for the order link.");
      setIsLoading(false);
      return;
    }

    try {
      let url = "/api/order?";
      if (orderId) url += `orderId=${orderId}`;
      else if (sessionId) url += `sessionId=${sessionId}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch order");
      }

      const data: OrderData = await response.json();
      
      setStatus(data.order.status as OrderStatus);
      setError(null);

      if (data.headshots && data.headshots.length > 0) {
        const formattedHeadshots: Headshot[] = data.headshots.map((h) => ({
          id: h.id,
          style: h.style,
          styleName: STYLE_NAMES[h.style] || h.style,
          url: h.storage_url,
        }));
        setHeadshots(formattedHeadshots);

        const styles = [...new Set(formattedHeadshots.map((h) => h.style))];
        setAvailableStyles(styles);
      } else {
        // No headshots yet - keep current status
        setHeadshots([]);
        setAvailableStyles([]);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(err instanceof Error ? err.message : "Failed to load order. Please try again.");
      setIsLoading(false);
    }
  }, [orderId, sessionId, isDemo]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  useEffect(() => {
    if (status === "training" || status === "generating" || status === "paid") {
      const interval = setInterval(() => {
        fetchOrderData();
        setProgress((prev) => {
          const increment = status === "training" ? 0.5 : 2;
          return Math.min(prev + increment, status === "training" ? 50 : 95);
        });
      }, 5000);

      return () => clearInterval(interval);
    }

    if (status === "completed") {
      setProgress(100);
    }
  }, [status, fetchOrderData]);

  useEffect(() => {
    switch (status) {
      case "pending": setProgress(0); break;
      case "paid": setProgress(10); break;
      case "training": setProgress(30); break;
      case "generating": setProgress(70); break;
      case "completed": setProgress(100); break;
    }
  }, [status]);

  const filteredHeadshots = selectedStyle
    ? headshots.filter((h) => h.style === selectedStyle)
    : headshots;

  const toggleImageSelection = (id: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedImages(new Set(filteredHeadshots.map((h) => h.id)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  const downloadSelected = async () => {
    const selectedHeadshots = headshots.filter((h) => selectedImages.has(h.id));
    
    if (selectedHeadshots.length === 1) {
      const link = document.createElement("a");
      link.href = selectedHeadshots[0].url;
      link.download = `headshot-${selectedHeadshots[0].style}.webp`;
      link.click();
    } else {
      alert(`Downloading ${selectedHeadshots.length} images...\n\nIn production, this would download a zip file.`);
      selectedHeadshots.forEach((h) => {
        window.open(h.url, "_blank");
      });
    }
  };

  const isProcessing = ["pending", "paid", "training", "generating"].includes(status);

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
            <div className="flex items-center gap-3">
              {status === "completed" && (
                <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Check className="w-3 h-3" />
                  Ready to download
                </span>
              )}
              {isDemo && (
                <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                  Demo
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
              <SkeletonGrid count={12} columns={4} aspectRatio="portrait" />
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => fetchOrderData()} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Link href="/upload">
                  <Button>
                    Start New Order
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Processing State */}
          {!isLoading && !error && isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mb-3">
                {status === "training" ? "Training Your AI Model" : 
                 status === "generating" ? "Generating Headshots" :
                 "Processing Your Order"}
              </h1>
              <p className="text-muted-foreground mb-8">
                {status === "training" 
                  ? "Our AI is learning your unique features. This takes about 10-15 minutes."
                  : status === "generating"
                  ? "Creating professional headshots in multiple styles. Almost done!"
                  : "Please wait while we process your photos."}
              </p>

              <Card className="p-6 border-border/50 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 mb-6" />

                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { threshold: 10, icon: Check, label: "Uploaded" },
                    { threshold: 50, icon: Zap, label: "Training" },
                    { threshold: 90, icon: ImageIcon, label: "Generating" },
                  ].map((step, index) => (
                    <div key={index}>
                      <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        progress >= step.threshold ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {progress >= step.threshold ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{step.label}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                We&apos;ll email you when ready
              </div>
            </motion.div>
          )}

          {/* Completed State - Gallery */}
          {!isLoading && !error && status === "completed" && headshots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Your Headshots</h1>
                  <p className="text-sm text-muted-foreground">
                    {headshots.length} professional headshots generated
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedImages.size > 0 && (
                    <button
                      onClick={clearSelection}
                      className="text-xs bg-muted px-2.5 py-1.5 rounded-full flex items-center gap-1 hover:bg-muted/80 transition-colors"
                    >
                      {selectedImages.size} selected
                      <span className="text-muted-foreground">×</span>
                    </button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectedImages.size === filteredHeadshots.length ? clearSelection : selectAll}
                  >
                    {selectedImages.size === filteredHeadshots.length ? "Deselect" : "Select All"}
                  </Button>
                  <div className="flex items-center border border-border rounded-lg p-0.5">
                    <button
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-muted" : "hover:bg-muted/50"}`}
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "large" ? "bg-muted" : "hover:bg-muted/50"}`}
                      onClick={() => setViewMode("large")}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    onClick={downloadSelected}
                    disabled={selectedImages.size === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download {selectedImages.size > 0 ? `(${selectedImages.size})` : ""}
                  </Button>
                </div>
              </div>

              {/* Style Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={selectedStyle === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStyle(null)}
                >
                  All Styles
                </Button>
                {availableStyles.map((style) => (
                  <Button
                    key={style}
                    variant={selectedStyle === style ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle(style)}
                  >
                    {STYLE_NAMES[style] || style}
                  </Button>
                ))}
              </div>

              {/* Gallery Grid */}
              <div className={`grid gap-3 ${
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              }`}>
                <AnimatePresence mode="popLayout">
                  {filteredHeadshots.map((headshot, index) => (
                    <motion.div
                      key={headshot.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      layout
                      className="relative group"
                    >
                      <Card
                        className={`overflow-hidden cursor-pointer transition-all ${
                          selectedImages.has(headshot.id)
                            ? "ring-2 ring-primary"
                            : "hover:ring-1 hover:ring-primary/50"
                        }`}
                        onClick={() => toggleImageSelection(headshot.id)}
                      >
                        <div className={`relative ${viewMode === "large" ? "aspect-square" : "aspect-[3/4]"}`}>
                          <img
                            src={headshot.url}
                            alt={headshot.styleName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Selection indicator */}
                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedImages.has(headshot.id)
                            ? "border-primary bg-primary"
                            : "border-white/50 bg-black/20 opacity-0 group-hover:opacity-100"
                        }`}>
                          {selectedImages.has(headshot.id) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement("a");
                              link.href = headshot.url;
                              link.download = `headshot-${headshot.style}.webp`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(headshot.url, "_blank");
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>

                      {viewMode === "large" && (
                        <p className="mt-2 text-xs text-muted-foreground">{headshot.styleName}</p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Download All CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12"
              >
                <Card className="p-6 border-border/50 max-w-xl mx-auto text-center">
                  <h3 className="font-semibold mb-2">Love your headshots?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download all {headshots.length} headshots in one click
                  </p>
                  <Button
                    size="lg"
                    onClick={() => {
                      selectAll();
                      setTimeout(downloadSelected, 100);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All Headshots
                  </Button>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && !error && status === "completed" && headshots.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No headshots yet</h2>
              <p className="text-muted-foreground mb-6">
                Start by uploading your photos to generate professional headshots.
              </p>
              <Link href="/upload">
                <Button>
                  Upload Photos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Failed State */}
          {!isLoading && !error && status === "failed" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center"
            >
              <Card className="p-6 border-destructive/50">
                <h1 className="text-xl font-bold mb-3">Something went wrong</h1>
                <p className="text-muted-foreground mb-6">
                  We encountered an issue processing your order. Please contact support.
                </p>
                <Button asChild>
                  <Link href="mailto:support@getpicpro.com">Contact Support</Link>
                </Button>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
