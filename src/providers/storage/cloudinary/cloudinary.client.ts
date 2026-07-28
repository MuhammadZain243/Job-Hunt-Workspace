import "server-only";

import { v2 as cloudinary, type ConfigOptions } from "cloudinary";

export function createCloudinaryClient(config: ConfigOptions) {
  const instance = cloudinary;
  instance.config(config);
  return instance;
}
