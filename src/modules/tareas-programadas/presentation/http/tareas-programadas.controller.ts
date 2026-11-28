import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import {
  ROLES_ADMINISTRACION,
  ROLES_SUPER_ADMIN,
} from 'src/auth/roles/grupos-roles';
import { OperacionSensible } from 'src/auth/step-up/operacion-sensible.decorator';

import { EjecutarTareaManualUseCase } from '../../application/use-cases/ejecutar-tarea-manual.use-case';
import { ListarEjecucionesTareaUseCase } from '../../application/use-cases/listar-ejecuciones-tarea.use-case';
import { ListarTareasManualesUseCase } from '../../application/use-cases/listar-tareas-manuales.use-case';
import { EjecutarTareaManualDto } from '../dto/ejecutar-tarea-manual.dto';
import { ListarEjecucionesTareaQueryDto } from '../dto/listar-ejecuciones-tarea-query.dto';
import { EjecucionTareaPresenter } from '../presenters/ejecucion-tarea.presenter';

@ApiTags('tareas-programadas')
@Controller('tareas-programadas')
export class TareasProgramadasController {
  constructor(
    private readonly listarEjecuciones: ListarEjecucionesTareaUseCase,
    private readonly listarManuales: ListarTareasManualesUseCase,
    private readonly ejecutarManual: EjecutarTareaManualUseCase,
  ) {}

  /** Registro de ejecuciones de las tareas programadas. */
  @Get('ejecuciones')
  @Roles(...ROLES_ADMINISTRACION)
  async ejecuciones(@Query() query: ListarEjecucionesTareaQueryDto) {
    return EjecucionTareaPresenter.listado(
      await this.listarEjecuciones.execute(query),
    );
  }

  /** Tareas que se pueden lanzar a mano. */
  @Get('manuales')
  @Roles(...ROLES_ADMINISTRACION)
  manuales() {
    return EjecucionTareaPresenter.manuales(this.listarManuales.execute());
  }

  /**
   * Lanza a mano una tarea interna con su clave de hoy (pide contraseña).
   * 403 `TAREA_PROGRAMADA_NO_MANUAL` si no se puede lanzar a mano; 409
   * `TAREA_PROGRAMADA_EN_CURSO` si ya corre o corre la jornada del día.
   */
  @Post(':tarea/ejecutar')
  @HttpCode(HttpStatus.OK)
  @Roles(...ROLES_SUPER_ADMIN)
  @OperacionSensible()
  async ejecutar(
    @Param('tarea') tarea: string,
    @Body() dto: EjecutarTareaManualDto,
    @Actor() actor: ActorHttp,
  ) {
    return EjecucionTareaPresenter.resultadoManual(
      await this.ejecutarManual.execute({
        tarea,
        usuarioId: actor.usuarioId,
        contrasenaActual: dto.contrasenaActual,
      }),
    );
  }
}
