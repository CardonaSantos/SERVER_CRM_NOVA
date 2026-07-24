import { Injectable, NotImplementedException } from '@nestjs/common';

import { CreatePpoePerfilHomologacionDto } from '../../dto/create-ppoe-perfil-homologacion.dto';

import { UpdatePpoePerfilHomologacionDto } from '../../dto/update-ppoe-perfil-homologacion.dto';

import { PerfilHomologacionEntity } from '../../domain/entities/ppoe-perfil-homologacion.entity';

import { CrearPerfilHomologacionUseCase } from '../use-cases/crear-perfil-homologacion.use-case';

import { ObtenerPerfilHomologacionUseCase } from '../use-cases/obtener-perfil-homologacion.use-case';

import { ActualizarCodigoPerfilHomologacionUseCase } from '../use-cases/actualizar-codigo-perfil-homologacion.use-case';

import { ActivarPerfilHomologacionUseCase } from '../use-cases/activar-perfil-homologacion.use-case';

import { DesactivarPerfilHomologacionUseCase } from '../use-cases/desactivar-perfil-homologacion.use-case';
import { CambiarEstadoPpoePerfilHomologacionDto } from '../dto/cambiar-estado-ppoe-perfil-homologacion.dto';
import { ListarPerfilesHomologacionUseCase } from '../use-cases/listar-perfiles-homologacion.use-case';
import { ListarPpoePerfilesHomologacionQueryDto } from '../dto/listar-ppoe-perfiles-homologacion-query.dto';
import { PerfilHomologacionPaginatedResult } from '../../domain/models/pppoe-perfil-homologacion.read-model';

@Injectable()
export class PpoePerfilHomologacionService {
  constructor(
    private readonly crearPerfilHomologacionUseCase: CrearPerfilHomologacionUseCase,

    private readonly obtenerPerfilHomologacionUseCase: ObtenerPerfilHomologacionUseCase,

    private readonly actualizarCodigoPerfilHomologacionUseCase: ActualizarCodigoPerfilHomologacionUseCase,

    private readonly activarPerfilHomologacionUseCase: ActivarPerfilHomologacionUseCase,

    private readonly desactivarPerfilHomologacionUseCase: DesactivarPerfilHomologacionUseCase,

    private readonly listarPerfilesHomologacionUseCase: ListarPerfilesHomologacionUseCase,
  ) {}

  create(
    dto: CreatePpoePerfilHomologacionDto,
  ): Promise<PerfilHomologacionEntity> {
    return this.crearPerfilHomologacionUseCase.execute(dto);
  }

  findOne(id: number): Promise<PerfilHomologacionEntity> {
    return this.obtenerPerfilHomologacionUseCase.execute({
      id,
    });
  }

  update(
    id: number,
    dto: UpdatePpoePerfilHomologacionDto,
  ): Promise<PerfilHomologacionEntity> {
    return this.actualizarCodigoPerfilHomologacionUseCase.execute({
      id,

      codigoPerfil: dto.codigoPerfil,

      actualizadoPorId: dto.actualizadoPorId,
    });
  }

  activar(
    id: number,
    dto: CambiarEstadoPpoePerfilHomologacionDto,
  ): Promise<PerfilHomologacionEntity> {
    return this.activarPerfilHomologacionUseCase.execute({
      id,

      actualizadoPorId: dto.actualizadoPorId,
    });
  }

  desactivar(
    id: number,
    dto: CambiarEstadoPpoePerfilHomologacionDto,
  ): Promise<PerfilHomologacionEntity> {
    return this.desactivarPerfilHomologacionUseCase.execute({
      id,

      actualizadoPorId: dto.actualizadoPorId,
    });
  }

  /**
   * Compatibilidad temporal con el controller generado.
   *
   * El listado real se implementará después con paginación
   * y relaciones enriquecidas.
   */
  findAll(
    query: ListarPpoePerfilesHomologacionQueryDto,
  ): Promise<PerfilHomologacionPaginatedResult> {
    return this.listarPerfilesHomologacionUseCase.execute(query);
  }

  /**
   * No se permite eliminar físicamente una homologación.
   *
   * Debe utilizarse la operación de desactivación.
   */
  remove(_id: number): never {
    throw new NotImplementedException(
      'Las homologaciones no se eliminan físicamente. Utilice la operación de desactivación.',
    );
  }
}
