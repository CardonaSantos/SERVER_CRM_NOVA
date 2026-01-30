import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UploadClienteArchivosDto } from '../dto/create-credito-cliente-expediente.dto';
import {
  CLIENTE_EXPEDIENTE_REPOSITORY,
  CreditoClienteExpedienteRepository,
} from '../domain/credito-cliente-expediente.repository';
import { SubirMediaUseCase } from 'src/modules/digital-ocean-media/application/use-cases/subir-media.usecase';
import {
  SUBIR_MEDIA_USECASE,
  UPLOAD_FILE_USECASE,
} from 'src/modules/digital-ocean-media/tokens/tokens';
import { SubirMediaCommand } from 'src/modules/digital-ocean-media/application/dto/subir-media.dto';
import { UploadFileUseCase } from 'src/modules/digital-ocean-media/application/use-cases/upload-file.usecase';
import { MediaRepositoryPort } from 'src/modules/digital-ocean-media/domain/ports/media-repository.port';
import {
  generarKey,
  inferExtension,
} from 'src/modules/digital-ocean-media/application/utils/key.util';
import { ClienteArchivo } from '../entities/cliente-archivo.entity';

interface DtoCargarFile {
  buffer: Buffer;
  mime: string;
  fileName?: string;
  empresaId: number;
  clienteId?: number;
  tipo?: string;
  basePrefix?: string;
}

@Injectable()
export class CreditoClienteExpedienteService {
  private readonly logger = new Logger(CreditoClienteExpedienteService.name);

  constructor(
    @Inject(UPLOAD_FILE_USECASE)
    private readonly uploadFile: UploadFileUseCase,

    @Inject(CLIENTE_EXPEDIENTE_REPOSITORY)
    private readonly clienteExpedienteRepo: CreditoClienteExpedienteRepository,
  ) {}

  async uploadClienteArchivos(
    clienteId: number,
    files: Express.Multer.File[],
    dto: UploadClienteArchivosDto,
  ) {
    if (files.length !== dto.tipos.length) {
      throw new BadRequestException('Cada archivo debe tener un tipo asignado');
    }

    for (const file of files) {
      const payload: DtoCargarFile = {
        buffer: file.buffer,
        empresaId: 1,
        mime: file.mimetype,
        basePrefix: 'crm',
        clienteId: clienteId,
        fileName: file.filename,
      };
      const result = await this.uploadFile.execute(payload);

      const dto = ClienteArchivo.crear({
        expedienteId: 1,
        tipo: 'OTRO',
        url: result.cdnUrl,
        descripcion: 'Mi descripcion',
      });

      const newFileStoraged = await this.clienteExpedienteRepo.saveMedia(dto);
    }
  }

  async getAllArchivos() {
    try {
      return await this.clienteExpedienteRepo.getAllMedia();
    } catch (error) {
      this.logger.error(error);
    }
  }
}
