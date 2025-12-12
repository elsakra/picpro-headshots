// Simple job queue implementation
// In production, use BullMQ, Inngest, or similar

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  type: "training" | "generation";
  status: JobStatus;
  progress: number;
  data: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory job store (use Redis/database in production)
const jobs = new Map<string, Job>();

export function createJob(
  type: Job["type"],
  data: Record<string, unknown>
): Job {
  const job: Job = {
    id: generateJobId(),
    type,
    status: "pending",
    progress: 0,
    data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(
  id: string,
  updates: Partial<Pick<Job, "status" | "progress" | "result" | "error">>
): Job | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  const updatedJob = {
    ...job,
    ...updates,
    updatedAt: new Date(),
  };

  jobs.set(id, updatedJob);
  return updatedJob;
}

export function getJobsByUser(userId: string): Job[] {
  return Array.from(jobs.values()).filter(
    (job) => job.data.userId === userId
  );
}

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Process job (simplified - in production use proper queue worker)
export async function processJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) throw new Error("Job not found");

  updateJob(jobId, { status: "processing", progress: 10 });

  try {
    if (job.type === "training") {
      // Simulate training progress
      for (let i = 20; i <= 90; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateJob(jobId, { progress: i });
      }

      updateJob(jobId, {
        status: "completed",
        progress: 100,
        result: {
          modelVersion: `user_${job.data.userId}_model_v1`,
          completedAt: new Date().toISOString(),
        },
      });
    } else if (job.type === "generation") {
      // Simulate generation progress
      for (let i = 20; i <= 90; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        updateJob(jobId, { progress: i });
      }

      updateJob(jobId, {
        status: "completed",
        progress: 100,
        result: {
          images: [
            "/demo/headshot-1.jpg",
            "/demo/headshot-2.jpg",
            "/demo/headshot-3.jpg",
            "/demo/headshot-4.jpg",
          ],
          completedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    updateJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// Webhook handler for Replicate callbacks
export interface ReplicateWebhook {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  logs?: string;
}

export function handleReplicateWebhook(
  jobId: string,
  webhook: ReplicateWebhook
): Job | undefined {
  const statusMap: Record<ReplicateWebhook["status"], JobStatus> = {
    starting: "processing",
    processing: "processing",
    succeeded: "completed",
    failed: "failed",
    canceled: "failed",
  };

  const updates: Parameters<typeof updateJob>[1] = {
    status: statusMap[webhook.status],
  };

  if (webhook.status === "processing") {
    updates.progress = 50; // Approximate progress
  } else if (webhook.status === "succeeded") {
    updates.progress = 100;
    updates.result = {
      output: webhook.output,
      logs: webhook.logs,
    };
  } else if (webhook.status === "failed" || webhook.status === "canceled") {
    updates.error = webhook.error || `Job ${webhook.status}`;
  }

  return updateJob(jobId, updates);
}


