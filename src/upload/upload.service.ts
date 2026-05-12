import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UploadService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async saveFile(file: Express.Multer.File, isPrivate = false) {
    try {
      const filename = `${Date.now()}-${file.originalname}`;
      const bucket = isPrivate ? process.env.R2_PRIVATE_BUCKET : process.env.R2_PUBLIC_BUCKET;
      
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      if (isPrivate) {
        // For private files, we don't return a direct public URL
        return {
          filename,
          isPrivate: true
        };
      }

      const publicUrl = `${process.env.R2_PUBLIC_URL}/${filename}`;
      return {
        url: publicUrl,
        filename: filename
      };
    } catch (error) {
      console.error('R2 Upload Error:', error);
      throw new InternalServerErrorException('Failed to upload to Cloudflare R2');
    }
  }

  async getPresignedUrl(filename: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.R2_PRIVATE_BUCKET,
        Key: filename,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate presigned URL');
    }
  }
}
