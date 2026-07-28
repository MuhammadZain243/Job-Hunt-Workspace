export type CvStorageProvider = "local" | "cloudinary" | "s3";

export type AppSettings = {
  userId: string;
  timezone: string;
  locale: string;
  dailyEmailLimit: number;
  minFollowUpHours: number;
  cvStorageProvider: CvStorageProvider;
  autoFollowUpsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AppSettingsCreateInput = {
  userId: string;
  timezone?: string;
  locale?: string;
  dailyEmailLimit?: number;
  minFollowUpHours?: number;
  cvStorageProvider?: CvStorageProvider;
  autoFollowUpsEnabled?: boolean;
};
