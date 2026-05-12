import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('private') isPrivate: string
  ) {
    if (!file) throw new BadRequestException('No image provided');
    return this.uploadService.saveFile(file, isPrivate === 'true');
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('private') isPrivate: string
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.uploadService.saveFile(file, isPrivate === 'true');
  }
}
