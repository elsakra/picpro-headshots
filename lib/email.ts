import { Resend } from "resend";

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Warning: RESEND_API_KEY is not set");
    return null;
  }
  
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "hello@picpro.ai";
const APP_NAME = "PicPro AI";
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Email templates
export async function sendWelcomeEmail(email: string, name?: string) {
  const resend = getResendClient();
  
  if (!resend) {
    console.log("Demo mode: Would send welcome email to", email);
    return { success: true, demo: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Welcome to ${APP_NAME}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #c9a227; margin: 0;">${APP_NAME}</h1>
            </div>
            
            <h2>Welcome${name ? `, ${name}` : ""}! 👋</h2>
            
            <p>Thank you for choosing ${APP_NAME} for your professional headshots.</p>
            
            <p>We're processing your photos and creating your AI-powered headshots. This usually takes about 15-30 minutes.</p>
            
            <p>We'll send you another email as soon as your headshots are ready to download.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">What happens next?</h3>
              <ol style="margin-bottom: 0;">
                <li>Our AI analyzes your photos</li>
                <li>A custom model is trained on your features</li>
                <li>Professional headshots are generated</li>
                <li>You receive an email with your results</li>
              </ol>
            </div>
            
            <p>If you have any questions, just reply to this email.</p>
            
            <p>Best,<br>The ${APP_NAME} Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Email error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

export async function sendHeadshotsReadyEmail(
  email: string,
  dashboardUrl: string,
  headshotCount: number
) {
  const resend = getResendClient();
  
  if (!resend) {
    console.log("Demo mode: Would send headshots ready email to", email);
    return { success: true, demo: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Your ${headshotCount} AI Headshots are Ready! 📸`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #c9a227; margin: 0;">${APP_NAME}</h1>
            </div>
            
            <h2>Your Headshots are Ready! 🎉</h2>
            
            <p>Great news! We've finished generating your <strong>${headshotCount} professional AI headshots</strong>.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: #c9a227; color: #000; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                View & Download Your Headshots
              </a>
            </div>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your package includes:</h3>
              <ul style="margin-bottom: 0;">
                <li>${headshotCount} high-resolution headshots</li>
                <li>Multiple professional styles</li>
                <li>Ready for LinkedIn, resumes & more</li>
                <li>Unlimited downloads</li>
              </ul>
            </div>
            
            <p><strong>Pro tip:</strong> Your headshots are stored securely and available for download anytime. We recommend downloading them to keep a backup.</p>
            
            <p>Love your headshots? We'd appreciate a quick review or share on social media!</p>
            
            <p>Best,<br>The ${APP_NAME} Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
              <a href="${APP_URL}" style="color: #666;">Visit our website</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Email error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

export async function sendRefundConfirmationEmail(email: string, amount: number) {
  const resend = getResendClient();
  
  if (!resend) {
    console.log("Demo mode: Would send refund email to", email);
    return { success: true, demo: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Refund Processed - ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #c9a227; margin: 0;">${APP_NAME}</h1>
            </div>
            
            <h2>Refund Processed</h2>
            
            <p>We've processed your refund of <strong>$${amount.toFixed(2)}</strong>.</p>
            
            <p>The refund should appear in your account within 5-10 business days, depending on your bank.</p>
            
            <p>We're sorry ${APP_NAME} wasn't the right fit for you. If you have any feedback on how we can improve, we'd love to hear it.</p>
            
            <p>Best,<br>The ${APP_NAME} Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Email error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}
