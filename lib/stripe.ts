import Stripe from "stripe";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_KEY) {
  console.warn("⚠️ Warning: STRIPE_SECRET_KEY is not set - payments will fail");
}

export const stripe = new Stripe(STRIPE_KEY || "", {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

export function isStripeConfigured(): boolean {
  return !!STRIPE_KEY && !STRIPE_KEY.includes("placeholder");
}

export const PRICING_TIERS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER || "price_starter",
    name: "Starter",
    price: 29,
    headshots: 40,
    styles: 5,
    delivery: "48 hours",
  },
  professional: {
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || "price_professional",
    name: "Professional",
    price: 49,
    headshots: 100,
    styles: 10,
    delivery: "2 hours",
  },
  executive: {
    priceId: process.env.STRIPE_PRICE_EXECUTIVE || "price_executive",
    name: "Executive",
    price: 99,
    headshots: 200,
    styles: 20,
    delivery: "1 hour",
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

