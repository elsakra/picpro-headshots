import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICING_TIERS, PricingTier, isStripeConfigured } from "@/lib/stripe";
import { createOrder } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tierId, email, tempUploadId } = body as { tierId: PricingTier; email?: string; tempUploadId?: string };

    // Validate tier
    if (!tierId || !PRICING_TIERS[tierId]) {
      return NextResponse.json(
        { error: "Invalid pricing tier" },
        { status: 400 }
      );
    }

    const tier = PRICING_TIERS[tierId];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Check if Stripe is properly configured
    if (!isStripeConfigured()) {
      // Demo mode - create order and redirect to dashboard
      const order = await createOrder(
        email || "demo@example.com",
        tierId,
        tier.price
      );

      return NextResponse.json({
        demo: true,
        message: "Stripe not configured - proceeding in demo mode",
        orderId: order.id,
        url: `${baseUrl}/dashboard?demo=true&order=${order.id}`,
      });
    }

    // Create Stripe checkout session with pre-created price
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: tier.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        tierId,
        headshots: tier.headshots.toString(),
        styles: tier.styles.toString(),
        tempUploadId: tempUploadId || "",
      },
      success_url: `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=true`,
    });

    // Create order in database with pending status
    if (email) {
      await createOrder(email, tierId, tier.price, session.id);
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
