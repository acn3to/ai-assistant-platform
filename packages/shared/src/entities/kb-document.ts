export interface IKBDocument {
  assistantId: string;
  filename: string;
  category: string;
  contentType: string;
  sizeBytes: number;
  s3Key: string;
  syncStatus: 'pending' | 'synced' | 'error';
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

