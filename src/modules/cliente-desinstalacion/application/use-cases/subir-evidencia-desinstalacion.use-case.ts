import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CategoriaMedia, TipoMedia } from '@prisma/client';

import { SubirMediaUseCase } from 'src/modules/digital-ocean-media/application/use-cases/subir-media.usecase';

import { SUBIR_MEDIA_USECASE } from 'src/modules/digital-ocean-media/tokens/tokens';

import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/domain/enums/tipo-evidencia-cliente-operacion.enum';

import { ClienteDesinstalacionMediaEntity } from '../../domain/entities/cliente-desinstalacion-media.entity';

import { ClienteDesinstalacionMediaRepositoryPort } from '../../domain/ports/cliente-desinstalacion-media.repository.port';

import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';

import {
  CLIENTE_DESINSTALACION_MEDIA_REPOSITORY,
  CLIENTE_DESINSTALACION_REPOSITORY,
} from '../../infra/tokens/cliente-desinstalacion.token';

export type SubirEvidenciaDesinstalacionCommand = {
  desinstalacionId: number;

  subidoPorId: number;

  file: Express.Multer.File;

  tipo: TipoEvidenciaClienteOperacion;

  descripcion?: string | null;

  orden?: number | null;
};

@Injectable()
export class SubirEvidenciaDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_MEDIA_REPOSITORY)
    private readonly evidenciaRepository: ClienteDesinstalacionMediaRepositoryPort,

    @Inject(SUBIR_MEDIA_USECASE)
    private readonly subirMediaUseCase: SubirMediaUseCase,
  ) {}

  async execute(command: SubirEvidenciaDesinstalacionCommand) {
    this.validateCommand(command);

    const desinstalacion = await this.desinstalacionRepository.findById(
      command.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    const props = desinstalacion.toPrimitives();

    const media = await this.subirMediaUseCase.execute({
      empresaId: props.empresaId,

      clienteId: props.clienteId,

      subidoPorId: command.subidoPorId,

      buffer: command.file.buffer,

      /**
       * Enviamos el MIME declarado por Multer.
       * SubirMediaUseCase comprobará después la firma
       * binaria real y lo corregirá cuando sea necesario.
       */
      mime: command.file.mimetype,

      fileName: command.file.originalname,

      categoria: CategoriaMedia.CLIENTE_DESINSTALACION,

      tipo: this.mapTipoMedia(command.file.mimetype),

      publico: true,

      descripcion: command.descripcion ?? undefined,

      etiqueta: 'DESINSTALACION',

      basePrefix: 'crm/desinstalaciones',
    });

    const evidencia = ClienteDesinstalacionMediaEntity.create({
      desinstalacionId: command.desinstalacionId,

      mediaId: media.id,

      tipo: command.tipo,

      descripcion: command.descripcion ?? null,

      orden: command.orden ?? 0,
    });

    const evidenciaCreada = await this.evidenciaRepository.create(evidencia);

    return {
      evidencia: evidenciaCreada.toPrimitives(),

      media: {
        id: media.id,

        cdnUrl: media.cdnUrl ?? null,

        key: media.key,

        tipo: media.tipo,
      },
    };
  }

  private mapTipoMedia(mime: string): TipoMedia {
    const mimeNormalizado = mime.trim().toLowerCase();

    if (mimeNormalizado.startsWith('image/')) {
      return TipoMedia.IMAGEN;
    }

    if (mimeNormalizado.startsWith('video/')) {
      return TipoMedia.VIDEO;
    }

    if (mimeNormalizado.startsWith('audio/')) {
      return TipoMedia.AUDIO;
    }

    if (
      mimeNormalizado === 'application/pdf' ||
      mimeNormalizado.startsWith('application/')
    ) {
      return TipoMedia.DOCUMENTO;
    }

    return TipoMedia.OTRO;
  }

  private validateCommand(command: SubirEvidenciaDesinstalacionCommand): void {
    if (
      !Number.isInteger(command.desinstalacionId) ||
      command.desinstalacionId <= 0
    ) {
      throw new BadRequestException(
        'desinstalacionId debe ser un entero positivo.',
      );
    }

    if (!Number.isInteger(command.subidoPorId) || command.subidoPorId <= 0) {
      throw new BadRequestException('subidoPorId debe ser un entero positivo.');
    }

    if (!command.file) {
      throw new BadRequestException('El archivo es obligatorio.');
    }

    if (!command.file.buffer?.length) {
      throw new BadRequestException('El archivo recibido está vacío.');
    }

    if (!command.file.mimetype?.trim()) {
      throw new BadRequestException(
        'No fue posible determinar el tipo MIME del archivo.',
      );
    }
  }
}
