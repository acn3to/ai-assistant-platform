import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { IS3Adapter } from '../interfaces/s3.adapter.interface';

const KB_BUCKET_NAME = process.env.KB_BUCKET_NAME || '';

class S3Adapter implements IS3Adapter {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({ region: process.env.REGION || 'us-east-1' });
  }

  async upload(key: string, content: Buffer, contentType: string, metadata: Record<string, string>): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: KB_BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: contentType,
        Metadata: metadata,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: KB_BUCKET_NAME,
        Key: key,
      }),
    );
  }
}

export const s3Adapter = new S3Adapter();
