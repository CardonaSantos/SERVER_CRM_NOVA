import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ActualizarClienteDesinstalacionDto } from '../application/dto/actualizar-desinstalacion-cliente.dto';
import { ActualizarCostosDesinstalacionDto } from '../application/dto/actualizar-costos-desinstalacion.dto';
import {
  AprobarDesinstalacionAutorizacionDto,
  RechazarDesinstalacionAutorizacionDto,
  SolicitarDesinstalacionAutorizacionDto,
} from '../application/dto/autorizacion-desinstalacion.dto';
import { CancelarClienteDesinstalacionDto } from '../application/dto/cancelar-cliente-desinstalacion.dto';
import { CompletarClienteDesinstalacionDto } from '../application/dto/completar-cliente-desinstalacion.dto';
import { CrearClienteDesinstalacionDto } from '../application/dto/create-desinstalacion-cliente.dto';
import { FiltrarClienteDesinstalacionesDto } from '../application/dto/filtrar-cliente-desinstalaciones.dto';
import { IniciarClienteDesinstalacionDto } from '../application/dto/iniciar-cliente-desinstalacion.dto';
import { ReprogramarClienteDesinstalacionDto } from '../application/dto/reprogramar-cliente-desinstalacion.dto';
import { AsignarTecnicoDesinstalacionDto } from '../application/dto/tecnico-desinstalacion.dto';

import { ClienteDesInstalacionApplicationService } from '../application/services/cliente-desinstalacion.service';

import { ClienteDesinstalacionAutorizacionPresenter } from './autorizacion-cliente-desinstalacion.presenter';
import { ClienteDesinstalacionPresenter } from './cliente-desinstalacion.presenter';
import { ClienteDesinstalacionTecnicoPresenter } from './cliente-desinstalacion-tecnico.presenter';

@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('cliente-desinstalaciones')
export class ClienteDesinstalacionController {
  constructor(
    private readonly clienteDesinstalacionService: ClienteDesInstalacionApplicationService,
  ) {}

  // AUTORIZACIONES

  @Get('autorizaciones/pendientes')
  async listarAutorizacionesPendientes() {
    const result =
      await this.clienteDesinstalacionService.listarAutorizacionesPendientes();

    return ClienteDesinstalacionAutorizacionPresenter.pendientesToHttp(result);
  }

  @Patch('autorizaciones/:id/aprobar')
  async aprobarAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarDesinstalacionAutorizacionDto,
    @Req() req: any,
  ) {
    const autorizadoPorId = req.user?.id ?? 1;

    const result = await this.clienteDesinstalacionService.aprobarAutorizacion(
      id,
      dto,
      autorizadoPorId,
    );

    return ClienteDesinstalacionAutorizacionPresenter.respuestaToHttp(result);
  }

  @Patch('autorizaciones/:id/rechazar')
  async rechazarAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RechazarDesinstalacionAutorizacionDto,
    @Req() req: any,
  ) {
    const autorizadoPorId = req.user?.id ?? 1;

    const result = await this.clienteDesinstalacionService.rechazarAutorizacion(
      id,
      dto,
      autorizadoPorId,
    );

    return ClienteDesinstalacionAutorizacionPresenter.respuestaToHttp(result);
  }

  // LISTADO Y CREACIÓN

  @Post()
  async crear(@Body() dto: CrearClienteDesinstalacionDto, @Req() req: any) {
    const creadoPorId = req.user?.id ?? dto.solicitadoPorId ?? 1;

    const result = await this.clienteDesinstalacionService.crear(
      dto,
      creadoPorId,
    );

    return ClienteDesinstalacionPresenter.crearToHttp(result);
  }

  @Get()
  async listar(@Query() query: FiltrarClienteDesinstalacionesDto) {
    const result = await this.clienteDesinstalacionService.listar(query);

    return ClienteDesinstalacionPresenter.paginatedToHttp(result);
  }

  // DETALLE

  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number) {
    const detalle = await this.clienteDesinstalacionService.obtener(id);

    return ClienteDesinstalacionPresenter.detalleToHttp(detalle);
  }

  // DATOS GENERALES

  @Patch(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.clienteDesinstalacionService.actualizar(
      id,
      dto,
    );

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  @Patch(':id/reprogramar')
  async reprogramar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReprogramarClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.clienteDesinstalacionService.reprogramar(
      id,
      dto,
    );

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  @Patch(':id/costos')
  async actualizarCostos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarCostosDesinstalacionDto,
  ) {
    const desinstalacion =
      await this.clienteDesinstalacionService.actualizarCostos(id, dto);

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  // FLUJO OPERATIVO

  @Patch(':id/iniciar')
  async iniciar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IniciarClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.clienteDesinstalacionService.iniciar(
      id,
      dto,
    );

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  @Patch(':id/completar')
  async completar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompletarClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.clienteDesinstalacionService.completar(
      id,
      dto,
    );

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  @Patch(':id/cancelar')
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelarClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.clienteDesinstalacionService.cancelar(
      id,
      dto,
    );

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  // AUTORIZACIÓN POR DESINSTALACIÓN

  @Post(':id/autorizaciones')
  async crearAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SolicitarDesinstalacionAutorizacionDto,
  ) {
    const solicitadoPorId = dto.solicitadoPorId;

    const autorizacion =
      await this.clienteDesinstalacionService.crearAutorizacion(
        id,
        dto,
        solicitadoPorId,
      );

    return ClienteDesinstalacionAutorizacionPresenter.toHttp(autorizacion);
  }

  // TÉCNICOS

  @Post(':id/tecnicos')
  async asignarTecnico(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarTecnicoDesinstalacionDto,
  ) {
    const tecnico = await this.clienteDesinstalacionService.asignarTecnico(
      id,
      dto,
    );

    return ClienteDesinstalacionTecnicoPresenter.toHttp(tecnico);
  }

  @Get(':id/tecnicos')
  async listarTecnicos(@Param('id', ParseIntPipe) id: number) {
    const tecnicos = await this.clienteDesinstalacionService.listarTecnicos(id);

    return ClienteDesinstalacionTecnicoPresenter.listToHttp(tecnicos);
  }

  @Delete(':id/tecnicos/:tecnicoOperacionId')
  async eliminarTecnico(
    @Param('id', ParseIntPipe) id: number,
    @Param('tecnicoOperacionId', ParseIntPipe) tecnicoOperacionId: number,
  ) {
    await this.clienteDesinstalacionService.eliminarTecnico(
      id,
      tecnicoOperacionId,
    );

    return {
      ok: true,
    };
  }
}
