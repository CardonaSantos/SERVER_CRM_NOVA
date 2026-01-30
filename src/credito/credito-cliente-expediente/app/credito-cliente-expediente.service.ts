import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UploadArchivosDto } from '../dto/create-credito-cliente-expediente.dto';
import {
  CLIENTE_EXPEDIENTE_REPOSITORY,
  CreditoClienteExpedienteRepository,
} from '../domain/credito-cliente-expediente.repository';
import { UPLOAD_FILE_USECASE } from 'src/modules/digital-ocean-media/tokens/tokens';
import { UploadFileUseCase } from 'src/modules/digital-ocean-media/application/use-cases/upload-file.usecase';
import { ClienteArchivo } from '../entities/cliente-archivo.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteExpediente } from '../entities/credito-cliente-expediente.entity';
import { ClienteReferencia } from '../entities/cliente-referencia.entity';
import { Prisma } from '@prisma/client';
import { throwFatalError } from 'src/Utils/CommonFatalError';

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
    private readonly prisma: PrismaService,

    @Inject(UPLOAD_FILE_USECASE)
    private readonly uploadFile: UploadFileUseCase,

    @Inject(CLIENTE_EXPEDIENTE_REPOSITORY)
    private readonly clienteExpedienteRepo: CreditoClienteExpedienteRepository,
  ) {}

  async orquestarCreacionExpediente(
    clienteId: number,
    files: Express.Multer.File[],
    dto: UploadArchivosDto,
  ) {
    this.logger.log(
      `orquestarCreacionExpediente: \n${JSON.stringify(dto, null, 2)}`,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const rec = ClienteExpediente.crear({
          clienteId,
          detalleDeudas: dto.detalleDeudas,
          fuenteIngresos: dto.fuenteIngresos,
          tieneDeudas: dto.tieneDeudas,
        });

        const expediente = await this.clienteExpedienteRepo.saveExpediente(
          rec,
          tx,
        );

        this.logger.log(
          `El nuevo expediente es: \n${JSON.stringify(expediente, null, 2)}`,
        );

        if (dto.referencias?.length) {
          for (const referencia of dto.referencias) {
            const ref = ClienteReferencia.crear({
              expedienteId: expediente.getId(),
              nombre: referencia.nombre,
              relacion: referencia.relacion,
              telefono: referencia.telefono,
            });

            let reff = await this.clienteExpedienteRepo.saveReferencia(ref, tx);

            this.logger.log(
              `La nueva referencia es: \n${JSON.stringify(reff, null, 2)}`,
            );
          }
        }

        await this.uploadClienteArchivos(
          expediente.getId(),
          clienteId,
          files,
          dto,
          tx,
        );

        return {
          expediente,
          mensaje: 'Expediente creado correctamente',
        };
      });
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'CreditoClienteExpedienteService.orquestarCrecionExpediente',
      );
    }
  }

  async uploadClienteArchivos(
    expedienteId: number,
    clienteId: number,
    files: Express.Multer.File[],
    dto: UploadArchivosDto,
    tx: Prisma.TransactionClient,
  ) {
    if (files.length !== dto.tipos.length) {
      throw new BadRequestException('Cada archivo debe tener un tipo asignado');
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const uploaded = await this.uploadFile.execute({
        empresaId: 1,
        clienteId,
        buffer: file.buffer,
        mime: file.mimetype,
        basePrefix: 'crm',
        fileName: file.originalname,
      });

      const archivo = ClienteArchivo.crear({
        expedienteId,
        tipo: dto.tipos[i],
        url: uploaded.cdnUrl,
        descripcion: dto.descripciones?.[i],
      });

      await this.clienteExpedienteRepo.saveMedia(archivo, tx);
    }
  }

  async getAllArchivos() {
    try {
      return await this.clienteExpedienteRepo.getAllMedia();
    } catch (error) {
      this.logger.error(error);
    }
  }

  async obtenerExpedientePorCredito(creditoId: number) {
    const credito = await this.prisma.credito.findUnique({
      where: { id: creditoId },
      include: {
        cliente: true,
      },
    });

    if (!credito) {
      throw new NotFoundException('Crédito no encontrado');
    }

    const expediente = await this.prisma.clienteExpediente.findMany({
      where: {
        clienteId: credito.clienteId,
      },
      include: {
        archivos: true,
        referencias: true,
      },
    });

    this.logger.log(`El expediente: \n${JSON.stringify(expediente, null, 2)}`);

    if (!expediente) {
      return {
        mensaje: 'El cliente aún no tiene expediente',
      };
    }

    return expediente;
  }

  async deleteExpediente(id: number) {
    return await this.clienteExpedienteRepo.deleteExpediente(id);
  }
}
