import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrGeneratorService {
  private readonly logger = new Logger(QrGeneratorService.name);

  /**
   * Generate QR code as buffer
   */
  async generateQRCode(data: string): Promise<Buffer> {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(data, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 300,
        margin: 2,
      });

      this.logger.debug(`QR code generated for data: ${data.substring(0, 50)}...`);

      return qrCodeBuffer;
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate QR code as data URL
   */
  async generateQRCodeDataURL(data: string): Promise<string> {
    try {
      const dataURL = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2,
      });

      return dataURL;
    } catch (error) {
      this.logger.error(`Failed to generate QR code data URL: ${error.message}`, error.stack);
      throw error;
    }
  }
}
