import { inngest, Events } from "@/lib/inngest";
import { createTrainingJob, generateHeadshots, HeadshotStyle, HEADSHOT_STYLES } from "@/lib/replicate";
import { updateOrderStatus, saveGeneratedHeadshot, createGenerationJob } from "@/lib/db";
import { uploadFromUrl, generateHeadshotKey } from "@/lib/storage";
import { sendHeadshotsReadyEmail } from "@/lib/email";

// Function to handle AI model training
export const trainModel = inngest.createFunction(
  { id: "train-model", name: "Train AI Model" },
  { event: "picpro/training.started" },
  async ({ event, step }) => {
    const { orderId, zipUrl, email } = event.data;

    // Step 1: Start training job
    const training = await step.run("start-training", async () => {
      const result = await createTrainingJob(zipUrl);
      await updateOrderStatus(orderId, "training", {
        training_job_id: result.trainingId,
      });
      return result;
    });

    // Step 2: Wait for training to complete (poll every 30 seconds for up to 30 minutes)
    const modelUrl = await step.run("wait-for-training", async () => {
      // In production, this would poll the training status
      // For now, we'll use webhooks instead
      return training.trainingId;
    });

    // Step 3: Trigger generation
    await step.sendEvent("trigger-generation", {
      name: "picpro/generation.started",
      data: {
        orderId,
        modelUrl,
        styles: Object.keys(HEADSHOT_STYLES),
        email,
      },
    });

    return { success: true, trainingId: training.trainingId };
  }
);

// Function to handle headshot generation
export const generateHeadshotsFunc = inngest.createFunction(
  { id: "generate-headshots", name: "Generate Headshots" },
  { event: "picpro/generation.started" },
  async ({ event, step }) => {
    const { orderId, modelUrl, styles, email } = event.data;

    await step.run("update-status", async () => {
      await updateOrderStatus(orderId, "generating");
    });

    // Generate headshots for each style
    const results = await step.run("generate-all-styles", async () => {
      const allHeadshots: string[] = [];

      for (const style of styles as HeadshotStyle[]) {
        try {
          const images = await generateHeadshots(modelUrl, style, 10);
          
          if (Array.isArray(images)) {
            // Save each generated image
            for (let i = 0; i < images.length; i++) {
              const key = generateHeadshotKey(orderId, style, i);
              const url = await uploadFromUrl(images[i], key);
              await saveGeneratedHeadshot(orderId, style, key, url);
              allHeadshots.push(url);
            }
          }
        } catch (error) {
          console.error(`Failed to generate ${style} headshots:`, error);
        }
      }

      return allHeadshots;
    });

    // Update order status and send email
    await step.run("complete-order", async () => {
      await updateOrderStatus(orderId, "completed");
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      await sendHeadshotsReadyEmail(email, `${baseUrl}/dashboard?order=${orderId}`, results.length);
    });

    return { success: true, headshotCount: results.length };
  }
);

// Function to handle new paid orders
export const handlePaidOrder = inngest.createFunction(
  { id: "handle-paid-order", name: "Handle Paid Order" },
  { event: "picpro/order.paid" },
  async ({ event, step }) => {
    const { orderId, email } = event.data;

    // Send welcome email
    await step.run("send-welcome", async () => {
      // In production, send a "we received your order" email
      console.log(`Order ${orderId} paid by ${email}`);
    });

    return { success: true };
  }
);

// Export all functions
export const functions = [trainModel, generateHeadshotsFunc, handlePaidOrder];

