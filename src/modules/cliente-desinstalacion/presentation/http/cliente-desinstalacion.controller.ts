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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA, ROLES_TECNICO } from 'src/auth/roles/grupos-roles';
import { OperacionSensible } from 'src/auth/step-up/operacion-sensible.decorator';
import { ActualizarClienteDesinstalacionUseCase } from '../../application/use-cases/actualizar-cliente-desinstalacion.use-case';
import { ActualizarCostosDesinstalacionUseCase } from '../../application/use-cases/actualizar-costos-desinstalacion.use-case';
import { AprobarAutorizacionDesinstalacionUseCase } from '../../application/use-cases/aprobar-autorizacion-cliente-desinstalacion.use-case';
import { AsignarTecnicoDesinstalacionUseCase } from '../../application/use-cases/asignar-tecnico-desinstalacion.use-case';
import { CancelarClienteDesinstalacionUseCase } from '../../application/use-cases/cancelar-cliente-desinstalacion.use-case';
import { CompletarClienteDesinstalacionUseCase } from '../../application/use-cases/completar-cliente-desinstalacion.use-case';
import { CrearAutorizacionDesinstalacionUseCase } from '../../application/use-cases/crear-autorizacion-cliente-desinstalacion.use-case';
import { CrearClienteDesinstalacionUseCase } from '../../application/use-cases/crear-cliente-desinstalacion.use-case';
import { EliminarTecnicoDesinstalacionUseCase } from '../../application/use-cases/eliminar-tecnico-desinstalacion.use-case';
import { IniciarClienteDesinstalacionUseCase } from '../../application/use-cases/iniciar-cliente-desinstalacion.use-case';
import { ListarAutorizacionesPendientesUseCase } from '../../application/use-cases/listar-autorizaciones-pendientes-desinstalacion.use-case';
import { ListarClienteDesinstalacionesUseCase } from '../../application/use-cases/listar-cliente-desinstalaciones.use-case';
import { ListarTecnicosDesinstalacionUseCase } from '../../application/use-cases/listar-tecnicos-desinstalacion.use-case';
import { MarcarFallidaClienteDesinstalacionUseCase } from '../../application/use-cases/marcar-fallida-cliente-desinstalacion.use-case';
import { ObtenerClienteDesinstalacionUseCase } from '../../application/use-cases/obtener-cliente-desinstalacion.use-case';
import { ObtenerContextoCreacionDesinstalacionUseCase } from '../../application/use-cases/obtener-contexto-creacion-desinstalacion.use-case';
import { RechazarAutorizacionDesinstalacionUseCase } from '../../application/use-cases/rechazar-autorizacion-cliente-desinstalacion.use-case';
import { ReprogramarClienteDesinstalacionUseCase } from '../../application/use-cases/reprogramar-cliente-desinstalacion.use-case';
import { SubirEvidenciaDesinstalacionUseCase } from '../../application/use-cases/subir-evidencia-desinstalacion.use-case';
import { ActualizarClienteDesinstalacionDto } from '../dto/actualizar-cliente-desinstalacion.dto';
import { ActualizarCostosDesinstalacionDto } from '../dto/actualizar-costos-desinstalacion.dto';
import { AsignarTecnicoDesinstalacionDto } from '../dto/asignar-tecnico-desinstalacion.dto';
import {
  AprobarDesinstalacionAutorizacionDto,
  RechazarDesinstalacionAutorizacionDto,
  SolicitarDesinstalacionAutorizacionDto,
} from '../dto/autorizacion-desinstalacion.dto';
import { CancelarClienteDesinstalacionDto } from '../dto/cancelar-cliente-desinstalacion.dto';
import { CompletarClienteDesinstalacionDto } from '../dto/completar-cliente-desinstalacion.dto';
import { CrearClienteDesinstalacionDto } from '../dto/crear-cliente-desinstalacion.dto';
import { IniciarClienteDesinstalacionDto } from '../dto/iniciar-cliente-desinstalacion.dto';
import { FiltrarAutorizacionesPendientesDto } from '../dto/listar-autorizaciones-pendientes-query.dto';
import { FiltrarClienteDesinstalacionesDto } from '../dto/listar-cliente-desinstalaciones-query.dto';
import { MarcarFallidaClienteDesinstalacionDto } from '../dto/marcar-fallida-cliente-desinstalacion.dto';
import { ReprogramarClienteDesinstalacionDto } from '../dto/reprogramar-cliente-desinstalacion.dto';
import { SubirEvidenciaDesinstalacionDto } from '../dto/subir-evidencia-desinstalacion.dto';
import { ClienteDesinstalacionAutorizacionPresenter } from '../presenters/autorizacion-desinstalacion.presenter';
import { ClienteDesinstalacionPresenter } from '../presenters/cliente-desinstalacion.presenter';
import { ClienteDesinstalacionTecnicoPresenter } from '../presenters/tecnico-desinstalacion.presenter';

@Controller('cliente-desinstalaciones')
export class ClienteDesinstalacionController {
  constructor(
    private readonly crearDesinstalacion: CrearClienteDesinstalacionUseCase,
    private readonly listarDesinstalaciones: ListarClienteDesinstalacionesUseCase,
    private readonly obtenerDesinstalacion: ObtenerClienteDesinstalacionUseCase,
    private readonly obtenerContexto: ObtenerContextoCreacionDesinstalacionUseCase,
    private readonly actualizarDesinstalacion: ActualizarClienteDesinstalacionUseCase,
    private readonly reprogramarDesinstalacion: ReprogramarClienteDesinstalacionUseCase,
    private readonly actualizarCostos: ActualizarCostosDesinstalacionUseCase,
    private readonly iniciarDesinstalacion: IniciarClienteDesinstalacionUseCase,
    private readonly completarDesinstalacion: CompletarClienteDesinstalacionUseCase,
    private readonly cancelarDesinstalacion: CancelarClienteDesinstalacionUseCase,
    private readonly marcarFallida: MarcarFallidaClienteDesinstalacionUseCase,
    private readonly subirEvidencia: SubirEvidenciaDesinstalacionUseCase,
    private readonly crearAutorizacion: CrearAutorizacionDesinstalacionUseCase,
    private readonly listarPendientes: ListarAutorizacionesPendientesUseCase,
    private readonly aprobarAutorizacion: AprobarAutorizacionDesinstalacionUseCase,
    private readonly rechazarAutorizacion: RechazarAutorizacionDesinstalacionUseCase,
    private readonly asignarTecnico: AsignarTecnicoDesinstalacionUseCase,
    private readonly listarTecnicos: ListarTecnicosDesinstalacionUseCase,
    private readonly eliminarTecnico: EliminarTecnicoDesinstalacionUseCase,
  ) {}

  // AUTORIZACIONES

  @Get('autorizaciones/pendientes')
  async autorizacionesPendientes(
    @Query() query: FiltrarAutorizacionesPendientesDto,
  ) {
    const resultado = await this.listarPendientes.execute(query);

    return ClienteDesinstalacionAutorizacionPresenter.pendientes(resultado);
  }

  /** Aprobar elimina el acceso PPPoE del cliente en el router: pide contraseña. */
  @Patch('autorizaciones/:id/aprobar')
  @Roles(...ROLES_OFICINA)
  @OperacionSensible()
  async aprobar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarDesinstalacionAutorizacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.aprobarAutorizacion.execute({
      id,
      autorizadoPorId: actor.usuarioId,
      contrasenaActual: dto.contrasenaActual,
      comentarioAutorizador: dto.comentarioAutorizador,
    });

    return ClienteDesinstalacionAutorizacionPresenter.respuestaToHttp(
      resultado,
    );
  }

  @Patch('autorizaciones/:id/rechazar')
  @Roles(...ROLES_OFICINA)
  async rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RechazarDesinstalacionAutorizacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.rechazarAutorizacion.execute({
      id,
      autorizadoPorId: actor.usuarioId,
      comentarioAutorizador: dto.comentarioAutorizador,
    });

    return ClienteDesinstalacionAutorizacionPresenter.respuestaToHttp(
      resultado,
    );
  }

  // LISTADO Y CREACIÓN

  @Post()
  @Roles(...ROLES_OFICINA)
  async crear(
    @Body() dto: CrearClienteDesinstalacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.crearDesinstalacion.execute({
      ...dto,
      creadoPorId: actor.usuarioId,
    });

    return ClienteDesinstalacionPresenter.crearToHttp(resultado);
  }

  @Get()
  async listar(@Query() query: FiltrarClienteDesinstalacionesDto) {
    const resultado = await this.listarDesinstalaciones.execute(query);

    return ClienteDesinstalacionPresenter.listado(resultado);
  }

  @Get('contexto-creacion/:clienteId')
  async contextoCreacion(@Param('clienteId', ParseIntPipe) clienteId: number) {
    const contexto = await this.obtenerContexto.execute(clienteId);

    return ClienteDesinstalacionPresenter.contextoCreacion(contexto);
  }

  // DETALLE

  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number) {
    const detalle = await this.obtenerDesinstalacion.execute({ id });

    return ClienteDesinstalacionPresenter.detalleToHttp(detalle);
  }

  // DATOS GENERALES

  @Patch(':id')
  @Roles(...ROLES_OFICINA)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.actualizarDesinstalacion.execute({
      ...dto,
      id,
    });

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  @Patch(':id/reprogramar')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async reprogramar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReprogramarClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.reprogramarDesinstalacion.execute({
      ...dto,
      id,
    });

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  @Patch(':id/costos')
  @Roles(...ROLES_OFICINA)
  async costos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarCostosDesinstalacionDto,
  ) {
    const desinstalacion = await this.actualizarCostos.execute({ ...dto, id });

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  // FLUJO OPERATIVO

  @Patch(':id/iniciar')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async iniciar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IniciarClienteDesinstalacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const desinstalacion = await this.iniciarDesinstalacion.execute({
      id,
      fechaInicio: dto.fechaInicio,
      ejecutadoPorId: actor.usuarioId,
    });

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  @Patch(':id/completar')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async completar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompletarClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.completarDesinstalacion.execute({
      ...dto,
      id,
    });

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  @Patch(':id/cancelar')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelarClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.cancelarDesinstalacion.execute({
      ...dto,
      id,
    });

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  @Patch(':id/fallar')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async fallar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarcarFallidaClienteDesinstalacionDto,
  ) {
    const desinstalacion = await this.marcarFallida.execute({ ...dto, id });

    return ClienteDesinstalacionPresenter.toHttp(desinstalacion);
  }

  // EVIDENCIAS

  @Post(':id/evidencias/upload')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  @UseInterceptors(FileInterceptor('file'))
  async subirEvidenciaDesinstalacion(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: SubirEvidenciaDesinstalacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.subirEvidencia.execute({
      desinstalacionId: id,
      subidoPorId: actor.usuarioId,
      file,
      tipo: dto.tipo,
      descripcion: dto.descripcion ?? null,
      orden: dto.orden ?? 0,
    });

    return ClienteDesinstalacionPresenter.evidenciaSubida(resultado);
  }

  @Post(':id/autorizaciones')
  @Roles(...ROLES_OFICINA)
  async solicitarAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SolicitarDesinstalacionAutorizacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const autorizacion = await this.crearAutorizacion.execute({
      desinstalacionId: id,
      solicitadoPorId: actor.usuarioId,
      motivoSolicitud: dto.motivoSolicitud,
    });

    return ClienteDesinstalacionAutorizacionPresenter.toHttp(autorizacion);
  }

  // TÉCNICOS

  @Post(':id/tecnicos')
  @Roles(...ROLES_OFICINA)
  async asignar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarTecnicoDesinstalacionDto,
  ) {
    const tecnico = await this.asignarTecnico.execute({
      ...dto,
      desinstalacionId: id,
    });

    return ClienteDesinstalacionTecnicoPresenter.toHttp(tecnico);
  }

  @Get(':id/tecnicos')
  async tecnicos(@Param('id', ParseIntPipe) id: number) {
    const lista = await this.listarTecnicos.execute(id);

    return ClienteDesinstalacionTecnicoPresenter.lista(lista);
  }

  @Delete(':id/tecnicos/:tecnicoOperacionId')
  @Roles(...ROLES_OFICINA)
  async quitarTecnico(
    @Param('id', ParseIntPipe) id: number,
    @Param('tecnicoOperacionId', ParseIntPipe) tecnicoOperacionId: number,
  ) {
    await this.eliminarTecnico.execute({
      desinstalacionId: id,
      tecnicoOperacionId,
    });

    return { ok: true };
  }
}
