import {
  Controller,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  Get,
  BadRequestException,
  Logger,
  UsePipes,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { CreditoClienteExpedienteService } from '../app/credito-cliente-expediente.service';
import { UploadArchivosDto } from '../dto/create-credito-cliente-expediente.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('credito-cliente-expediente')
export class CreditoClienteExpedienteController {
  private readonly logger = new Logger(CreditoClienteExpedienteController.name);
  constructor(
    private readonly creditoClienteExpedienteService: CreditoClienteExpedienteService,
  ) {}

  @Post(':clienteId/archivos')
  @UseInterceptors(FilesInterceptor('files'))
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async uploadArchivos(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() dto: UploadArchivosDto,
  ) {
    this.logger.log(`--- Debug Upload Cliente ${clienteId} ---`);
    this.logger.log(`Archivos recibidos: ${files?.length || 0}`);
    this.logger.log(`Cuerpo del DTO (Raw): ${JSON.stringify(dto, null, 2)}`);

    if (!files || files.length === 0) {
      throw new BadRequestException('No se enviaron archivos');
    }
    if (files.length !== dto.tipos.length) {
      throw new BadRequestException(
        `La cantidad de archivos (${files.length}) no coincide con la cantidad de tipos enviados (${dto.tipos.length})`,
      );
    }

    return this.creditoClienteExpedienteService.orquestarCreacionExpediente(
      clienteId,
      files,
      dto,
    );
  }

  @Get('')
  async getAllArchivos() {
    return this.creditoClienteExpedienteService.getAllArchivos();
  }

  @Get(':creditoId/expediente')
  async getExpedientePorCredito(
    @Param('creditoId', ParseIntPipe) creditoId: number,
  ) {
    return this.creditoClienteExpedienteService.obtenerExpedientePorCredito(
      creditoId,
    );
  }

  @Delete(':id')
  async deleteExpediente(@Param('id', ParseIntPipe) id: number) {
    return this.creditoClienteExpedienteService.deleteExpediente(id);
  }
}
