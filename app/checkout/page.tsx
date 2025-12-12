"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Clock,
  Zap,
  CreditCard,
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceId: string;
  popular: boolean;
  features: string[];
  delivery: string;
  headshots: number;
  description: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    priceId: "price_starter",
    popular: false,
    description: "Perfect for LinkedIn",
    features: [
      "40 AI headshots",
      "5 professional styles",
      "High-resolution downloads",
      "Basic backgrounds",
    ],
    delivery: "48 hours",
    headshots: 40,
  },
  {
    id: "professional",
    name: "Professional",
    price: 49,
    priceId: "price_professional",
    popular: true,
    description: "Best for job seekers",
    features: [
      "100 AI headshots",
      "10 professional styles",
      "4K resolution downloads",
      "Premium backgrounds",
      "LinkedIn banner included",
    ],
    delivery: "2 hours",
    headshots: 100,
  },
  {
    id: "executive",
    name: "Executive",
    price: 99,
    priceId: "price_executive",
    popular: false,
    description: "Complete package",
    features: [
      "200+ AI headshots",
      "All styles unlocked",
      "4K + RAW formats",
      "Custom backgrounds",
      "Full branding package",
      "Priority support",
    ],
    delivery: "1 hour",
    headshots: 200,
  },
];

export default function CheckoutPage() {
  const [selectedTier, setSelectedTier] = useState<string>("professional");
  const [photoCount, setPhotoCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [tempUploadId, setTempUploadId] = useState<string | null>(null);

  useEffect(() => {
    const storedPhotos = localStorage.getItem("uploadedPhotos");
    if (storedPhotos) {
      const photos = JSON.parse(storedPhotos);
      setPhotoCount(photos.length);
    }
    
    // Get the temp upload ID from the uploaded photos data
    const uploadData = localStorage.getItem("uploadedPhotosData");
    if (uploadData) {
      const data = JSON.parse(uploadData);
      setTempUploadId(data.tempUploadId);
    }
  }, []);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: pricingTiers.find((t) => t.id === selectedTier)?.priceId,
          tierId: selectedTier,
          tempUploadId: tempUploadId,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        localStorage.setItem("selectedTier", selectedTier);
        window.location.href = "/dashboard?demo=true";
      }
    } catch (error) {
      console.error("Checkout error:", error);
      localStorage.setItem("selectedTier", selectedTier);
      window.location.href = "/dashboard?demo=true";
    }
  };

  const selectedPlan = pricingTiers.find((t) => t.id === selectedTier);

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
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
                <Check className="w-3 h-3" />
              </span>
              <span>Upload</span>
              <ArrowRight className="w-4 h-4 mx-2" />
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">2</span>
              <span className="text-foreground">Checkout</span>
              <ArrowRight className="w-4 h-4 mx-2" />
              <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center">3</span>
              <span>Download</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Package</h1>
            <p className="text-muted-foreground">
              {photoCount > 0 && (
                <span className="text-primary font-medium">
                  {photoCount} photos uploaded · 
                </span>
              )}
              {" "}Select the package that fits your needs
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Pricing tiers - left 2/3 */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid sm:grid-cols-3 gap-4"
              >
                {pricingTiers.map((tier, index) => (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Card
                      className={`relative p-4 cursor-pointer transition-all h-full ${
                        selectedTier === tier.id
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedTier(tier.id)}
                    >
                      {tier.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                            Best Value
                          </span>
                        </div>
                      )}

                      {/* Selection indicator */}
                      <div
                        className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedTier === tier.id
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {selectedTier === tier.id && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>

                      <div className="mb-3">
                        <h3 className="font-semibold">{tier.name}</h3>
                        <p className="text-xs text-muted-foreground">{tier.description}</p>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">${tier.price}</span>
                          <span className="text-xs text-muted-foreground">one-time</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-primary" />
                          {tier.headshots}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary" />
                          {tier.delivery}
                        </div>
                      </div>

                      <ul className="space-y-1.5">
                        {tier.features.slice(0, 3).map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2 text-xs">
                            <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                        {tier.features.length > 3 && (
                          <li className="text-xs text-muted-foreground pl-5">
                            +{tier.features.length - 3} more...
                          </li>
                        )}
                      </ul>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Order summary - right 1/3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:sticky lg:top-24 h-fit"
            >
              <Card className="p-5 border-border/50">
                <h3 className="font-semibold mb-4">Order Summary</h3>

                <div className="space-y-3 mb-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{selectedPlan?.name} Package</span>
                    <span className="font-medium">${selectedPlan?.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{selectedPlan?.headshots} AI Headshots</span>
                    <span className="text-primary text-xs">Included</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{selectedPlan?.delivery} Delivery</span>
                    <span className="text-primary text-xs">Included</span>
                  </div>
                  <div className="border-t border-border/50 pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${selectedPlan?.price}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay ${selectedPlan?.price} Now
                    </>
                  )}
                </Button>

                {/* Trust signals */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>Guarantee</span>
                  </div>
                </div>
              </Card>

              {/* Payment methods */}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">Trusted payment</p>
                <div className="flex items-center justify-center gap-4 opacity-50">
                  <span className="text-sm font-bold">VISA</span>
                  <span className="text-sm font-bold">Mastercard</span>
                  <span className="text-xs font-semibold">stripe</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Back button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Link href="/upload">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Upload
              </Button>
            </Link>
          </motion.div>

          {/* Features breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h3 className="text-lg font-semibold mb-4 text-center">All packages include</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Zap, title: "AI Processing", desc: "State-of-the-art models" },
                { icon: Shield, title: "Money Back", desc: "100% satisfaction guarantee" },
                { icon: Lock, title: "Privacy First", desc: "Photos deleted after use" },
                { icon: Clock, title: "Fast Delivery", desc: "Express options available" },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/20">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
