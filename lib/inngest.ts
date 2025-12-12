import { Inngest } from "inngest";

// Create Inngest client
export const inngest = new Inngest({
  id: "picpro-ai",
  name: "PicPro AI",
});

// Event types
export interface Events {
  "picpro/training.started": {
    data: {
      orderId: string;
      zipUrl: string;
      email: string;
    };
  };
  "picpro/training.completed": {
    data: {
      orderId: string;
      modelUrl: string;
      email: string;
    };
  };
  "picpro/generation.started": {
    data: {
      orderId: string;
      modelUrl: string;
      styles: string[];
      email: string;
    };
  };
  "picpro/generation.completed": {
    data: {
      orderId: string;
      headshotCount: number;
      email: string;
    };
  };
  "picpro/order.paid": {
    data: {
      orderId: string;
      email: string;
      tier: string;
    };
  };
}

