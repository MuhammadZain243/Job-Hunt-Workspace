import "server-only";

import { z } from "zod";

export const s3CredentialsSchema = z.object({
  endpoint: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(z.string().url("Endpoint must be a valid URL").optional()),
  region: z.string().min(1, "Region is required"),
  bucket: z.string().min(1, "Bucket is required"),
  accessKeyId: z.string().min(1, "Access key ID is required"),
  secretAccessKey: z.string().min(1, "Secret access key is required"),
  forcePathStyle: z.boolean().default(true),
});

export type S3CredentialsInput = z.infer<typeof s3CredentialsSchema>;
