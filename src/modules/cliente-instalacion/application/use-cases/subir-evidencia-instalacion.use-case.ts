import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TipoEvidenciaClienteOperacion } from '../../domain/enums/tipo-evidencia-cliente-operacion.enum';
import {
  CLIENTE_INSTALACION_MEDIA_REPOSITORY,
  CLIENTE_INSTALACION_REPOSITORY,
} from '../../infra/tokens/cliente-instalacion.tokens';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';
import { ClienteInstalacionMediaRepositoryPort } from '../../domain/ports/cliente-instalacion-media.repository.port';
import { SubirMediaUseCase } from 'src/modules/digital-ocean-media/application/use-cases/subir-media.usecase';
import { SUBIR_MEDIA_USECASE } from 'src/modules/digital-ocean-media/tokens/tokens';
import { ClienteInstalacionMediaEntity } from '../../domain/entities/cliente-instalacion-media.entity';

export type SubirEvidenciaInstalacionCommand = {
  instalacionId: number;
  empresaId?: number;
  subidoPorId?: number | null;

  file: Express.Multer.File;

  tipo: TipoEvidenciaClienteOperacion;
  descripcion?: string | null;
  orden?: number | null;
};

@Injectable()
export class SubirEvidenciaInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,

    @Inject(CLIENTE_INSTALACION_MEDIA_REPOSITORY)
    private readonly evidenciaRepository: ClienteInstalacionMediaRepositoryPort,

    @Inject(SUBIR_MEDIA_USECASE)
    private readonly subirMediaUseCase: SubirMediaUseCase,
  ) {}

  async execute(command: SubirEvidenciaInstalacionCommand) {
    if (!command.file) {
      throw new Error('Archivo requerido.');
    }

    const instalacion = await this.instalacionRepository.findById({
      id: command.instalacionId,
    });

    if (!instalacion) {
      throw new NotFoundException('Instalación no encontrada.');
    }

    const media = await this.subirMediaUseCase.execute({
      empresaId: command.empresaId,
      clienteId: instalacion.clienteId,
      subidoPorId: command.subidoPorId ?? undefined,

      buffer: command.file.buffer,
      mime: command.file.mimetype,
      fileName: command.file.originalname,

      categoria: 'CLIENTE_GENERAL' as any,
      tipo: this.mapTipoMedia(command.file.mimetype),

      publico: true,
      descripcion: command.descripcion ?? null,
      etiqueta: 'INSTALACION',
      basePrefix: 'crm/instalaciones',
    });

    const evidencia = ClienteInstalacionMediaEntity.create({
      instalacionId: command.instalacionId,
      mediaId: media.id,
      tipo: command.tipo,
      descripcion: command.descripcion ?? null,
      orden: command.orden ?? 0,
    });

    return this.evidenciaRepository.create(evidencia);
  }

  private mapTipoMedia(mime: string) {
    if (mime.startsWith('image/')) return 'IMAGEN' as any;
    if (mime.startsWith('video/')) return 'VIDEO' as any;
    if (mime.startsWith('audio/')) return 'AUDIO' as any;
    if (mime === 'application/pdf') return 'DOCUMENTO' as any;

    return 'OTRO' as any;
  }
}
