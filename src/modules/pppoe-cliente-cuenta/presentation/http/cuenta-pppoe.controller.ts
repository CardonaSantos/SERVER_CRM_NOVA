import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';

import { ConsultarCredencialesPppoeCuentaUseCase } from '../../application/use-cases/consultar-credenciales-pppoe-cuenta.use-case';
import { ListarCuentasPppoeUseCase } from '../../application/use-cases/listar-cuentas-pppoe.use-case';
import { ObtenerDetalleCuentaPppoeUseCase } from '../../application/use-cases/obtener-detalle-cuenta-pppoe.use-case';
import { ListarCuentasPppoeQueryDto } from '../dto/listar-cuentas-pppoe-query.dto';
import { CuentaPppoePresenter } from '../presenters/cuenta-pppoe.presenter';

@Controller('pppoe-cuentas')
export class CuentaPppoeController {
  constructor(
    private readonly listarCuentas: ListarCuentasPppoeUseCase,
    private readonly obtenerDetalleCuenta: ObtenerDetalleCuentaPppoeUseCase,
    private readonly consultarCredenciales: ConsultarCredencialesPppoeCuentaUseCase,
  ) {}

  /** Listado paginado de cuentas PPPoE. */
  @Get()
  async listar(@Query() query: ListarCuentasPppoeQueryDto) {
    const resultado = await this.listarCuentas.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      clienteId: query.clienteId,
      servicioInternetId: query.servicioInternetId,
      mikrotikRouterId: query.mikrotikRouterId,
      perfilHomologacionId: query.perfilHomologacionId,
      estadoCuenta: query.estadoCuenta,
      estadoAcceso: query.estadoAcceso,
      origen: query.origen,
    });
    return CuentaPppoePresenter.listado(resultado);
  }

  /**
   * Revela usuario y contraseña PPPoE. La contraseña se descifra solo para
   * esta respuesta y la consulta queda en la bitácora.
   */
  @Post(':cuentaPppoeId/revelar-credenciales')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async revelarCredenciales(
    @Param('cuentaPppoeId', ParseIntPipe) cuentaPppoeId: number,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.consultarCredenciales.execute({
      cuentaPppoeId,
      operadorId: actor.usuarioId,
      operadorNombre: actor.nombre || null,
      ipOrigen: actor.ip,
      userAgent: actor.userAgent,
    });
    return CuentaPppoePresenter.credenciales(resultado);
  }

  /**
   * Estado administrativo de la cuenta con las acciones permitidas.
   * El historial completo está en GET /pppoe-operaciones?cuentaPppoeId=:id.
   */
  @Get(':cuentaPppoeId')
  async obtenerDetalle(
    @Param('cuentaPppoeId', ParseIntPipe) cuentaPppoeId: number,
  ) {
    return CuentaPppoePresenter.detalle(
      await this.obtenerDetalleCuenta.execute({ cuentaPppoeId }),
    );
  }
}
