import {
  Controller,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  Get,
} from '@nestjs/common';
import { CreditoClienteExpedienteService } from '../app/credito-cliente-expediente.service';
import { UploadClienteArchivosDto } from '../dto/create-credito-cliente-expediente.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('credito-cliente-expediente')
export class CreditoClienteExpedienteController {
  constructor(
    private readonly creditoClienteExpedienteService: CreditoClienteExpedienteService,
  ) {}

  @Post(':clienteId/expediente/archivos')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadArchivos(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadClienteArchivosDto,
  ) {
    return this.creditoClienteExpedienteService.uploadClienteArchivos(
      clienteId,
      files,
      dto,
    );
  }

  @Get('')
  async getAllArchivos() {
    return this.creditoClienteExpedienteService.getAllArchivos();
  }
}
