export type AuditMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

export type AuditEventInput = {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  correlationId?: string;
  metadata?: AuditMetadata;
};

export type AuditEventDocument = {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  correlationId?: string;
  metadata: AuditMetadata;
  createdAt: Date;
};
