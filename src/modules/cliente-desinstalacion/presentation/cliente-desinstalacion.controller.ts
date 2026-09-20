import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
import { MarcarFallidaClienteDesinstalacionDto } from '../application/dto/marcar-fallida-cliente-desinstalacion.dto';
import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';
import { SubirEvidenciaDesinstalacionDto } from '../application/dto/subir-evidencia-desinstalacion.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FiltrarAutorizacionesPendientesDto } from '../application/dto/filtrar-autorizaciones-pendientes.dto';

@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('cliente-desinstalaciones')
export class ClienteDesinstalacionController {
  private readonly logger = new Logger(ClienteDesinstalacionController.name);
  constructor(
    private readonly clienteDesinstalacionService: ClienteDesInstalacionApplicationService,
  ) {}

  // AUTORIZACIONES

  @Get('autorizaciones/pendientes')
  async listarAutorizacionesPendientes(
    @Query()
    query: FiltrarAutorizacionesPendientesDto,
  ) {
    const result =
      await this.clienteDesinstalacionService.listarAutorizacionesPendientes(
        query,
      );

    return ClienteDesinstalacionAutorizacionPresenter.pendientesToHttp(result);
  }

  @Patch('autorizaciones/:id/aprobar')
  async aprobarAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarDesinstalacionAutorizacionDto,
    @Req() req: any,
  ) {
    const autorizadoPorId = this.obtenerUsuarioId(req);
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
    const autorizadoPorId = this.obtenerUsuarioId(req);

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
    const creadoPorId = this.obtenerUsuarioId(req);

    const result = await this.clienteDesinstalacionService.crear(
      dto,
      creadoPorId,
    );

    this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);

    return ClienteDesinstalacionPresenter.crearToHttp(result);
  }

  @Get()
  async listar(@Query() query: FiltrarClienteDesinstalacionesDto) {
    const result = await this.clienteDesinstalacionService.listar(query);

    return ClienteDesinstalacionPresenter.paginatedToHttp(result);
  }

  @Get('contexto-creacion/:clienteId')
  async obtenerContextoCreacion(
    @Param('clienteId', ParseIntPipe) clienteId: number,
  ) {
    return this.clienteDesinstalacionService.obtenerContextoCreacion(clienteId);
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
    @Req() req: any,
  ) {
    const ejecutadoPorId = this.obtenerUsuarioId(req);

    const desinstalacion = await this.clienteDesinstalacionService.iniciar(
      id,
      dto,
      ejecutadoPorId,
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

  @Patch(':id/fallar')
  async marcarFallida(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarcarFallidaClienteDesinstalacionDto,
  ) {
    const desinstalacion =
      await this.clienteDesinstalacionService.marcarFallida(id, dto);

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  // AUTORIZACIÓN POR DESINSTALACIÓN

  // EVIDENCIAS

  @Post(':id/evidencias/upload')
  @UseInterceptors(FileInterceptor('file'))
  async subirEvidencia(
    @Param('id', ParseIntPipe)
    id: number,

    @UploadedFile()
    file: Express.Multer.File,

    @Body()
    dto: SubirEvidenciaDesinstalacionDto,

    @Req()
    req: any,
  ) {
    const subidoPorId = this.obtenerUsuarioId(req);

    return this.clienteDesinstalacionService.cargarEvidencia({
      desinstalacionId: id,

      subidoPorId,

      file,

      tipo: dto.tipo,

      descripcion: dto.descripcion ?? null,

      orden: dto.orden ?? 0,
    });
  }

  @Post(':id/autorizaciones')
  async crearAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SolicitarDesinstalacionAutorizacionDto,
    @Req() req: any,
  ) {
    const solicitadoPorId = this.obtenerUsuarioId(req);

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

  private obtenerUsuarioId(req: any): number {
    const usuarioId = Number(req.user?.id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new UnauthorizedException(
        'No se pudo identificar al usuario autenticado.',
      );
    }

    return usuarioId;
  }
}
