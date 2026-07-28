import "server-only";

import { z } from "zod";

export const cloudinaryCredentialsSchema = z.object({
  cloudName: z.string().min(1, "Cloud name is required"),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
});

export type CloudinaryCredentialsInput = z.infer<typeof cloudinaryCredentialsSchema>;
