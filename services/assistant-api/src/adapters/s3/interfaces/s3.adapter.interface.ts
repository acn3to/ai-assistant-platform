export interface IS3Adapter {
  upload(key: string, content: Buffer, contentType: string, metadata: Record<string, string>): Promise<void>;
  delete(key: string): Promise<void>;
}
