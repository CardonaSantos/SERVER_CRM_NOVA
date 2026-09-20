import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

import { RequestWithAuthenticatedUser } from 'src/auth/interfaces/request-with-authenticated-user.interface';

import { ListarAuditoriaPppoeInstalacionQueryDto } from '../application/dto/listar-auditoria-pppoe-instalacion-query.dto';

import { PppoeAuditoriaService } from '../application/services/pppoe-auditoria.service';

import { PppoeAuditoriaInstalacionPresenter } from './pppoe-auditoria-instalacion.presenter';

@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('cliente-instalaciones')
export class PppoeAuditoriaInstalacionController {
  constructor(
    private readonly pppoeAuditoriaService: PppoeAuditoriaService,
  ) {}

  @Get(':instalacionId/auditoria-pppoe')
  @HttpCode(HttpStatus.OK)
  async findTimelineByInstalacion(
    @Param('instalacionId', ParseIntPipe)
    instalacionId: number,

    @Query()
    query: ListarAuditoriaPppoeInstalacionQueryDto,

    @Req()
    req: RequestWithAuthenticatedUser,
  ) {
    const actor = this.getAdministrativeActor(req);

    const result =
      await this.pppoeAuditoriaService.findTimelineByInstalacion({
        instalacionId,
        empresaId: actor.empresaId,
        actorRol: actor.rol,
        query,
      });

    if (!result) {
      throw new NotFoundException(
        `No se encontró la instalación ${instalacionId}.`,
      );
    }

    return PppoeAuditoriaInstalacionPresenter.paginatedToHttp(result);
  }

  private getAdministrativeActor(
    req: RequestWithAuthenticatedUser,
  ): {
    empresaId: number;
    rol: string;
  } {
    const empresaId = Number(req.user?.empresaId);

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar la empresa del operador.',
      );
    }

    const rol = req.user?.rol?.trim().toUpperCase();

    if (!rol) {
      throw new UnauthorizedException(
        'No fue posible identificar el rol del operador.',
      );
    }

    return {
      empresaId,
      rol,
    };
  }
}
