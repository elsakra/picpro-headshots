// Analytics and conversion tracking utilities
// Supports Meta Pixel, Google Ads, and custom analytics

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Track page view
export function trackPageView(url: string) {
  // Meta Pixel
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }

  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    });
  }
}

// Track custom events
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  // Meta Pixel
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }

  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }

  // Console log in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", eventName, params);
  }
}

// E-commerce tracking
export function trackPurchase(
  transactionId: string,
  value: number,
  currency: string = "USD",
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>
) {
  // Meta Pixel - Purchase
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", {
      value,
      currency,
      content_ids: items?.map((i) => i.id),
      content_type: "product",
    });
  }

  // Google Analytics - Purchase
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: transactionId,
      value,
      currency,
      items: items?.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  // Google Ads Conversion
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: `${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}/${process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL}`,
      value,
      currency,
      transaction_id: transactionId,
    });
  }
}

// Track add to cart / initiate checkout
export function trackInitiateCheckout(
  value: number,
  currency: string = "USD",
  tierId: string
) {
  // Meta Pixel
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      value,
      currency,
      content_ids: [tierId],
      content_type: "product",
    });
  }

  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "begin_checkout", {
      value,
      currency,
      items: [{ item_id: tierId }],
    });
  }
}

// Track upload started
export function trackUploadStarted(photoCount: number) {
  trackEvent("upload_started", { photo_count: photoCount });

  // Meta Pixel - Lead
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Lead", {
      content_name: "Photo Upload",
      content_category: "Upload",
    });
  }
}

// Track upload completed
export function trackUploadCompleted(photoCount: number) {
  trackEvent("upload_completed", { photo_count: photoCount });

  // Meta Pixel - Complete Registration equivalent
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "CompleteRegistration", {
      content_name: "Photo Upload Complete",
      value: photoCount,
    });
  }
}

// Track headshots ready
export function trackHeadshotsReady(headshotCount: number, tierId: string) {
  trackEvent("headshots_ready", {
    headshot_count: headshotCount,
    tier_id: tierId,
  });
}

// Track download
export function trackDownload(downloadCount: number) {
  trackEvent("headshots_downloaded", { count: downloadCount });
}


