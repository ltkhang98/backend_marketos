import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly baseUploadPath = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureDirectoryExists(this.baseUploadPath);
  }

  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, folder: string = ''): Promise<string> {
    try {
      if (!file) {
        throw new Error('No file provided in the request.');
      }
      if (!file.buffer) {
        throw new Error('File buffer is empty. Multer might be misconfigured.');
      }

      this.logger.log(`Saving file ${file.originalname} to folder ${folder}`);
      const uploadPath = path.join(this.baseUploadPath, folder);
      this.ensureDirectoryExists(uploadPath);

      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(uploadPath, fileName);

      await fs.promises.writeFile(filePath, file.buffer);

      this.logger.log(`File saved success: ${filePath}`);
      return `/uploads/${folder ? folder + '/' : ''}${fileName}`;
    } catch (error) {
      this.logger.error(`Error saving file: ${error.message}`);
      throw error;
    }
  }

  async saveBuffer(buffer: Buffer, originalName: string, folder: string = ''): Promise<string> {
    const uploadPath = path.join(this.baseUploadPath, folder);
    this.ensureDirectoryExists(uploadPath);

    const fileExt = path.extname(originalName) || '.jpg';
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadPath, fileName);

    await fs.promises.writeFile(filePath, buffer);

    return `/uploads/${folder ? folder + '/' : ''}${fileName}`;
  }
}
