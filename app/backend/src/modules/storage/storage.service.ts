import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './services/s3.service';
import { QrGeneratorService } from './services/qr-generator.service';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly qrGeneratorService: QrGeneratorService,
  ) {
    this.maxFileSize = this.configService.get<number>('storage.maxFileSize');
    this.allowedMimeTypes = this.configService.get<string[]>('storage.allowedMimeTypes');
  }

  /**
   * Validate file before upload
   */
  validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Check file extension
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }
  }

  /**
   * Compute SHA-256 hash of file
   */
  computeFileHash(fileBuffer: Buffer): string {
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    return `0x${hash}`;
  }

  /**
   * Upload certificate file
   */
  async uploadCertificate(file: Express.Multer.File): Promise<{
    fileUrl: string;
    fileKey: string;
    fileHash: string;
  }> {
    this.validateFile(file);

    const fileHash = this.computeFileHash(file.buffer);
    const { key, url } = await this.s3Service.uploadFile(
      file.buffer,
      file.mimetype,
      'certificates',
    );

    this.logger.log(`Certificate uploaded: ${key} (hash: ${fileHash})`);

    return {
      fileUrl: url,
      fileKey: key,
      fileHash,
    };
  }

  /**
   * Upload QR code
   */
  async uploadQRCode(credentialId: string, verificationUrl: string): Promise<string> {
    const qrCodeBuffer = await this.qrGeneratorService.generateQRCode(verificationUrl);
    const { url } = await this.s3Service.uploadFile(qrCodeBuffer, 'image/png', 'qrcodes');

    this.logger.log(`QR code uploaded for credential: ${credentialId}`);

    return url;
  }

  /**
   * Delete file
   */
  async deleteFile(fileKey: string): Promise<void> {
    await this.s3Service.deleteFile(fileKey);
    this.logger.log(`File deleted: ${fileKey}`);
  }

  /**
   * Generate verification URL
   */
  generateVerificationUrl(credentialId: string): string {
    const frontendUrl = this.configService.get<string>('app.corsOrigins').split(',')[0];
    return `${frontendUrl}/verify/${credentialId}`;
  }
}
