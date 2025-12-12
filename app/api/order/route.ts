import { NextRequest, NextResponse } from "next/server";
import { 
  getOrder, 
  getOrdersByEmail, 
  getOrderWithDetails,
  getOrderByStripeSession,
} from "@/lib/db";

// Get order details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const email = searchParams.get("email");
  const sessionId = searchParams.get("sessionId");

  try {
    // Get by Stripe session ID
    if (sessionId) {
      const order = await getOrderByStripeSession(sessionId);
      if (!order) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }
      
      const details = await getOrderWithDetails(order.id);
      return NextResponse.json(details);
    }

    // Get single order with details
    if (orderId) {
      const details = await getOrderWithDetails(orderId);
      if (!details) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(details);
    }

    // Get all orders for an email
    if (email) {
      const orders = await getOrdersByEmail(email);
      return NextResponse.json({ orders });
    }

    return NextResponse.json(
      { error: "orderId, email, or sessionId required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Failed to get order" },
      { status: 500 }
    );
  }
}

