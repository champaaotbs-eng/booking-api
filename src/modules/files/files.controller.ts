import { Controller, Delete, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FilesService } from "./files.service";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('files')
export class FilesController {
    constructor(private filesService: FilesService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    upload(@UploadedFile() file: Express.Multer.File) {
        return this.filesService.uploadFile(file)
    }

    @Delete(':publicId')
    delete(@Param('publicId') publicId: string) {
        return this.filesService.deleteFile(publicId)
    }
}