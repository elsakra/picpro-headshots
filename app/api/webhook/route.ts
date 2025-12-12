import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICING_TIERS, PricingTier } from "@/lib/stripe";
import { createOrder, updateOrderStatus, getOrderByStripeSession, getTempUpload, deleteTempUpload } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { createTrainingJob, isReplicateConfigured } from "@/lib/replicate";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      console.warn("Webhook: Missing signature or secret");
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract metadata
        const { tierId, tempUploadId } = session.metadata || {};
        const customerEmail = session.customer_details?.email;
        const paymentIntentId = typeof session.payment_intent === "string" 
          ? session.payment_intent 
          : session.payment_intent?.id;

        console.log("Payment successful:", {
          sessionId: session.id,
          tierId,
          tempUploadId,
          customerEmail,
          amount: session.amount_total,
        });

        // Check if order already exists
        let order = await getOrderByStripeSession(session.id);

        if (!order && customerEmail && tierId) {
          // Create order if it doesn't exist
          const tier = PRICING_TIERS[tierId as PricingTier];
          order = await createOrder(
            customerEmail,
            tierId as PricingTier,
            tier?.price || (session.amount_total ? session.amount_total / 100 : 0),
            session.id
          );
        }

        if (order) {
          // Update order status to paid
          await updateOrderStatus(order.id, "paid", {
            stripe_payment_intent_id: paymentIntentId,
          });

          // If we have a temp upload, start training
          if (tempUploadId) {
            const tempUpload = await getTempUpload(tempUploadId);
            
            if (tempUpload && isReplicateConfigured()) {
              // Start training with the uploaded photos
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
              const webhookUrl = `${baseUrl}/api/replicate-webhook`;

              try {
                const trainingJob = await createTrainingJob(tempUpload.zip_url, webhookUrl);
                
                // Update order with training job ID and status
                await updateOrderStatus(order.id, "training", {
                  training_job_id: trainingJob.trainingId,
                });

                console.log("Training started:", {
                  orderId: order.id,
                  trainingId: trainingJob.trainingId,
                  zipUrl: tempUpload.zip_url,
                });

                // Clean up temp upload
                await deleteTempUpload(tempUploadId);
              } catch (trainingError) {
                console.error("Failed to start training:", trainingError);
                // Order status remains "paid" - training can be retried
              }
            } else if (!tempUpload) {
              console.warn("Temp upload not found:", tempUploadId);
            }
          }
        }

        // Send welcome email
        if (customerEmail) {
          await sendWelcomeEmail(customerEmail);
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
        
        // You could update order status to failed here
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("Refund processed:", charge.id);
        
        // You could update order status and send refund email here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Note: In Next.js App Router, the raw body is available by default
// No additional configuration needed for Stripe webhooks
