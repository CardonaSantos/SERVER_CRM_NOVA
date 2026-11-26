import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA, ROLES_TECNICO } from 'src/auth/roles/grupos-roles';
import { OperacionSensible } from 'src/auth/step-up/operacion-sensible.decorator';
import { EndpointRetirado } from 'src/common/endpoint-retirado/endpoint-retirado.decorator';
import { ActivarPppoeInstalacionUseCase } from '../../application/use-cases/activar-pppoe-instalacion.use-case';
import { ActualizarClienteInstalacionUseCase } from '../../application/use-cases/actualizar-cliente-instalacion.use-case';
import { CancelarClienteInstalacionUseCase } from '../../application/use-cases/cancelar-cliente-instalacion.use-case';
import { CompletarClienteInstalacionUseCase } from '../../application/use-cases/completar-cliente-instalacion.use-case';
import { CrearClienteInstalacionUseCase } from '../../application/use-cases/crear-cliente-instalacion.use-case';
import { IniciarClienteInstalacionUseCase } from '../../application/use-cases/iniciar-cliente-instalacion.use-case';
import { ListarClienteInstalacionesUseCase } from '../../application/use-cases/listar-cliente-instalaciones.use-case';
import { ListarMisInstalacionesAsignadasUseCase } from '../../application/use-cases/listar-mis-instalaciones-asignadas.use-case';
import { ObtenerClienteInstalacionUseCase } from '../../application/use-cases/obtener-cliente-instalacion.use-case';
import { ObtenerDetalleTecnicoInstalacionUseCase } from '../../application/use-cases/obtener-detalle-tecnico-instalacion.use-case';
import { ReintentarPrealtaPppoeInstalacionUseCase } from '../../application/use-cases/reintentar-prealta-pppoe-instalacion.use-case';
import { ReprogramarClienteInstalacionUseCase } from '../../application/use-cases/reprogramar-cliente-instalacion.use-case';
import { RevelarCredencialesPppoeInstalacionUseCase } from '../../application/use-cases/revelar-credenciales-pppoe-instalacion.use-case';
import { SubirEvidenciaInstalacionUseCase } from '../../application/use-cases/subir-evidencia-instalacion.use-case';
import { ActivarPppoeInstalacionDto } from '../dto/activar-pppoe-instalacion.dto';
import { ActualizarClienteInstalacionDto } from '../dto/actualizar-cliente-instalacion.dto';
import { CancelarClienteInstalacionDto } from '../dto/cancelar-cliente-instalacion.dto';
import { CompletarClienteInstalacionDto } from '../dto/completar-cliente-instalacion.dto';
import { CrearClienteInstalacionDto } from '../dto/crear-cliente-instalacion.dto';
import { IniciarInstalacionClienteDto } from '../dto/iniciar-cliente-instalacion.dto';
import { FiltrarClienteInstalacionesDto } from '../dto/listar-cliente-instalaciones-query.dto';
import { FiltrarMisInstalacionesAsignadasDto } from '../dto/listar-mis-instalaciones-asignadas-query.dto';
import { ReintentarPrealtaPppoeDto } from '../dto/reintentar-prealta-pppoe.dto';
import { ReprogramarClienteInstalacionDto } from '../dto/reprogramar-cliente-instalacion.dto';
import { SubirEvidenciaInstalacionDto } from '../dto/subir-evidencia-instalacion.dto';
import { ClienteInstalacionPresenter } from '../presenters/cliente-instalacion.presenter';

@Controller('cliente-instalaciones')
export class ClienteInstalacionController {
  constructor(
    private readonly crearInstalacion: CrearClienteInstalacionUseCase,
    private readonly listarInstalaciones: ListarClienteInstalacionesUseCase,
    private readonly listarMisAsignadas: ListarMisInstalacionesAsignadasUseCase,
    private readonly obtenerInstalacion: ObtenerClienteInstalacionUseCase,
    private readonly obtenerDetalleTecnico: ObtenerDetalleTecnicoInstalacionUseCase,
    private readonly actualizarInstalacion: ActualizarClienteInstalacionUseCase,
    private readonly reprogramarInstalacion: ReprogramarClienteInstalacionUseCase,
    private readonly iniciarInstalacion: IniciarClienteInstalacionUseCase,
    private readonly completarInstalacion: CompletarClienteInstalacionUseCase,
    private readonly cancelarInstalacion: CancelarClienteInstalacionUseCase,
    private readonly subirEvidencia: SubirEvidenciaInstalacionUseCase,
    private readonly reintentarPrealta: ReintentarPrealtaPppoeInstalacionUseCase,
    private readonly activarPppoe: ActivarPppoeInstalacionUseCase,
    private readonly revelarCredenciales: RevelarCredencialesPppoeInstalacionUseCase,
  ) {}

  @Post()
  @Roles(...ROLES_OFICINA)
  async crear(
    @Body() dto: CrearClienteInstalacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.crearInstalacion.execute({
      ...dto,
      empresaId: actor.empresaId,
      creadoPorId: actor.usuarioId,
    });

    return ClienteInstalacionPresenter.crearToHttp(resultado);
  }

  @Post(':instalacionId/accesos/:accesoInternetId/prealta-pppoe/reintentar')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async reintentarPrealtaPppoe(
    @Param('instalacionId', ParseIntPipe) instalacionId: number,
    @Param('accesoInternetId', ParseIntPipe) accesoInternetId: number,
    @Body() dto: ReintentarPrealtaPppoeDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.reintentarPrealta.execute({
      instalacionId,
      accesoInternetId,
      mikrotikRouterId: dto.mikrotikRouterId,
      operadorId: actor.usuarioId,
      operadorNombre: actor.nombre,
      ipOrigen: actor.ip,
      userAgent: actor.userAgent,
    });

    return ClienteInstalacionPresenter.prealta(resultado);
  }

  @Post(':instalacionId/credenciales-pppoe/revelar')
  @HttpCode(HttpStatus.OK)
  async revelarCredencialesPppoe(
    @Param('instalacionId', ParseIntPipe) instalacionId: number,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.revelarCredenciales.execute({
      instalacionId,
      operadorId: actor.usuarioId,
      operadorNombre: actor.nombre,
      ipOrigen: actor.ip,
      userAgent: actor.userAgent,
    });

    return ClienteInstalacionPresenter.credenciales(resultado);
  }

  @Get()
  async listar(@Query() query: FiltrarClienteInstalacionesDto) {
    const resultado = await this.listarInstalaciones.execute(query);

    return ClienteInstalacionPresenter.listado(resultado);
  }

  /**
   * Instalaciones donde el técnico autenticado participa con cualquier rol.
   * El técnico sale del token, nunca de la petición.
   */
  @Get('mis-asignadas')
  @Roles(...ROLES_TECNICO)
  async misAsignadas(
    @Query() query: FiltrarMisInstalacionesAsignadasDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.listarMisAsignadas.execute({
      ...query,
      tecnicoId: actor.usuarioId,
    });

    return ClienteInstalacionPresenter.asignadas(resultado);
  }

  @Get(':id/tecnica')
  @Roles(...ROLES_TECNICO)
  async detalleTecnico(
    @Param('id', ParseIntPipe) id: number,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.obtenerDetalleTecnico.execute({
      instalacionId: id,
      actorId: actor.usuarioId,
    });

    return ClienteInstalacionPresenter.tecnicaToHttp(resultado);
  }

  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number) {
    const detalle = await this.obtenerInstalacion.execute({ id });

    return ClienteInstalacionPresenter.detalleToHttp(detalle);
  }

  @Patch(':id')
  @Roles(...ROLES_OFICINA)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarClienteInstalacionDto,
  ) {
    const instalacion = await this.actualizarInstalacion.execute({
      ...dto,
      id,
    });

    return ClienteInstalacionPresenter.toHttp(instalacion);
  }

  @Patch('reprogramar/:id')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async reprogramar(
    @Body() dto: ReprogramarClienteInstalacionDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const instalacion = await this.reprogramarInstalacion.execute({
      ...dto,
      id,
    });

    return ClienteInstalacionPresenter.toHttp(instalacion);
  }

  /** Inicio del trabajo del técnico en campo; no toca el router. */
  @Post('iniciar/:id')
  @Roles(...ROLES_TECNICO)
  @HttpCode(HttpStatus.OK)
  async iniciar(
    @Body() dto: IniciarInstalacionClienteDto,
    @Param('id', ParseIntPipe) id: number,
    @Actor() actor: ActorHttp,
  ) {
    const instalacion = await this.iniciarInstalacion.execute({
      id,
      tecnicoId: actor.usuarioId,
      fechaInicio: dto.fechaInicio,
    });

    return ClienteInstalacionPresenter.toHttp(instalacion);
  }

  /** Primera activación PPPoE desde oficina: crea y habilita el secret en el router. */
  @Post(':instalacionId/pppoe/activar')
  @Roles(...ROLES_OFICINA)
  @OperacionSensible()
  @HttpCode(HttpStatus.OK)
  async activarPppoeInstalacion(
    @Param('instalacionId', ParseIntPipe) instalacionId: number,
    @Body() dto: ActivarPppoeInstalacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.activarPppoe.execute({
      instalacionId,
      operadorId: actor.usuarioId,
      operadorNombre: actor.nombre,
      ipOrigen: actor.ip,
      userAgent: actor.userAgent,
      contrasenaActual: dto.contrasenaActual,
    });

    return ClienteInstalacionPresenter.activacionPppoe(resultado);
  }

  @Post('completar/:id')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async completar(
    @Body() dto: CompletarClienteInstalacionDto,
    @Param('id', ParseIntPipe) id: number,
    @Actor() actor: ActorHttp,
  ) {
    const instalacion = await this.completarInstalacion.execute({
      id,
      operadorId: actor.usuarioId,
      soloSiEstaAsignado: (ROLES_TECNICO as string[]).includes(actor.rol),
      resultado: dto.resultado,
      observaciones: dto.observaciones,
      fechaFinalizacion: dto.fechaFinalizacion,
    });

    return ClienteInstalacionPresenter.toHttp(instalacion);
  }

  @Post('cancelar/:id')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async cancelar(
    @Body() dto: CancelarClienteInstalacionDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const instalacion = await this.cancelarInstalacion.execute({
      ...dto,
      id,
    });

    return ClienteInstalacionPresenter.toHttp(instalacion);
  }

  @Post(':id/evidencias/upload')
  @UseInterceptors(FileInterceptor('file'))
  async subirEvidenciaInstalacion(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: SubirEvidenciaInstalacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const evidencia = await this.subirEvidencia.execute({
      instalacionId: id,
      empresaId: actor.empresaId,
      subidoPorId: actor.usuarioId,
      file,
      tipo: dto.tipo,
      descripcion: dto.descripcion ?? null,
      orden: dto.orden ?? 0,
    });

    return ClienteInstalacionPresenter.evidenciaSubida(evidencia);
  }

  @Delete('delete-all')
  @EndpointRetirado()
  deleteAll(): void {
    // Retirado: el guard responde 410 antes de llegar aquí.
  }
}
