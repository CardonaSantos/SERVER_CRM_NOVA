import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import {
  perteneceA,
  ROLES_OFICINA,
  ROLES_TECNICO,
} from 'src/auth/roles/grupos-roles';
import { ActualizarTicketUseCase } from '../../application/use-cases/actualizar-ticket.use-case';
import { CancelarTicketUseCase } from '../../application/use-cases/cancelar-ticket.use-case';
import { ContarTicketsUseCase } from '../../application/use-cases/contar-tickets.use-case';
import { CrearTicketUseCase } from '../../application/use-cases/crear-ticket.use-case';
import { DevolverTicketUseCase } from '../../application/use-cases/devolver-ticket.use-case';
import { EnviarTicketARevisionUseCase } from '../../application/use-cases/enviar-ticket-a-revision.use-case';
import { IniciarTicketUseCase } from '../../application/use-cases/iniciar-ticket.use-case';
import { ListarActividadTicketUseCase } from '../../application/use-cases/listar-actividad-ticket.use-case';
import { ListarOpcionesTicketUseCase } from '../../application/use-cases/listar-opciones-ticket.use-case';
import { ListarTicketsUseCase } from '../../application/use-cases/listar-tickets.use-case';
import { ObtenerBoletaTicketUseCase } from '../../application/use-cases/obtener-boleta-ticket.use-case';
import { ObtenerTicketUseCase } from '../../application/use-cases/obtener-ticket.use-case';
import { ReabrirTicketUseCase } from '../../application/use-cases/reabrir-ticket.use-case';
import { ResolverTicketUseCase } from '../../application/use-cases/resolver-ticket.use-case';
import { TicketFiltros } from '../../domain/read-models/ticket-listado.read-model';
import { ActualizarTicketDto } from '../dto/actualizar-ticket.dto';
import { CancelarTicketDto } from '../dto/cancelar-ticket.dto';
import { CrearTicketDto } from '../dto/crear-ticket.dto';
import { ListarActividadTicketQueryDto } from '../dto/listar-actividad-ticket-query.dto';
import { ListarTicketsQueryDto } from '../dto/listar-tickets-query.dto';
import { ResolverTicketDto } from '../dto/resolver-ticket.dto';
import { TicketActividadPresenter } from '../presenters/ticket-actividad.presenter';
import { TicketPresenter } from '../presenters/ticket.presenter';

/** La oficina cambia cualquier ticket. */
const gestiona = (actor: ActorHttp) => perteneceA(ROLES_OFICINA, actor.rol);

/** Un técnico solo ve los tickets que tiene asignados. */
const alcance = (actor: ActorHttp) =>
  perteneceA(ROLES_TECNICO, actor.rol) ? actor.usuarioId : undefined;

const quienActua = (actor: ActorHttp) => ({
  usuarioId: actor.usuarioId,
  usuarioNombre: actor.nombre,
  gestiona: gestiona(actor),
});

function filtros(
  query: ListarTicketsQueryDto,
  actor: ActorHttp,
): TicketFiltros {
  return {
    bandeja: query.bandeja,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    tecnicoIds: query.tecnicoIds,
    sinTecnico: query.sinTecnico,
    sectorIds: query.sectorIds,
    etiquetaIds: query.etiquetaIds,
    prioridades: query.prioridades,
    clienteId: query.clienteId,
    creadoPorId: query.creadoPorMi ? actor.usuarioId : query.creadoPorId,
    asignadoA: query.asignadosAMi ? actor.usuarioId : undefined,
    soloAsignadosA: alcance(actor),
    fechaDe: query.fechaDe,
    desde: query.desde,
    hasta: query.hasta,
  };
}

@ApiTags('ticket-soporte')
@Controller('ticket-soporte')
export class TicketSoporteController {
  constructor(
    private readonly crearTicket: CrearTicketUseCase,
    private readonly actualizarTicket: ActualizarTicketUseCase,
    private readonly listarTickets: ListarTicketsUseCase,
    private readonly contarTickets: ContarTicketsUseCase,
    private readonly listarOpciones: ListarOpcionesTicketUseCase,
    private readonly obtenerTicket: ObtenerTicketUseCase,
    private readonly listarActividad: ListarActividadTicketUseCase,
    private readonly obtenerBoleta: ObtenerBoletaTicketUseCase,
    private readonly iniciarTicket: IniciarTicketUseCase,
    private readonly enviarARevision: EnviarTicketARevisionUseCase,
    private readonly devolverTicket: DevolverTicketUseCase,
    private readonly resolverTicket: ResolverTicketUseCase,
    private readonly cancelarTicket: CancelarTicketUseCase,
    private readonly reabrirTicket: ReabrirTicketUseCase,
  ) {}

  @Post()
  crear(@Body() dto: CrearTicketDto, @Actor() actor: ActorHttp) {
    return this.crearTicket.execute({
      ...quienActua(actor),
      empresaId: actor.empresaId,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      clienteId: dto.clienteId,
      prioridad: dto.prioridad,
      tecnicoId: dto.tecnicoId,
      apoyoIds: dto.apoyoIds,
      etiquetaIds: dto.etiquetaIds,
      fijado: dto.fijado,
      telefonoTemporal: dto.telefonoTemporal,
    });
  }

  @Get()
  async listar(
    @Query() query: ListarTicketsQueryDto,
    @Actor() actor: ActorHttp,
  ) {
    return TicketPresenter.listado(
      await this.listarTickets.execute({
        ...filtros(query, actor),
        page: query.page,
        limit: query.limit,
      }),
    );
  }

  /** Totales por bandeja con los mismos filtros de la lista. */
  @Get('contadores')
  async contadores(
    @Query() query: ListarTicketsQueryDto,
    @Actor() actor: ActorHttp,
  ) {
    return TicketPresenter.contadores(
      await this.contarTickets.execute(filtros(query, actor)),
    );
  }

  @Get('opciones-filtro')
  async opciones() {
    return TicketPresenter.opciones(await this.listarOpciones.execute());
  }

  @Get(':ticketId')
  async detalle(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Actor() actor: ActorHttp,
  ) {
    return TicketPresenter.detalle(
      await this.obtenerTicket.execute({
        ticketId,
        usuarioId: actor.usuarioId,
        gestiona: gestiona(actor),
        soloAsignadosA: alcance(actor),
      }),
    );
  }

  /** Bitácora y comentarios en una sola línea de tiempo. */
  @Get(':ticketId/actividad')
  async actividad(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Query() query: ListarActividadTicketQueryDto,
    @Actor() actor: ActorHttp,
  ) {
    return TicketActividadPresenter.listado(
      await this.listarActividad.execute({
        ticketId,
        usuarioId: actor.usuarioId,
        gestiona: gestiona(actor),
        soloAsignadosA: alcance(actor),
        page: query.page,
        limit: query.limit,
        sortDir: query.sortDir,
      }),
    );
  }

  @Get(':ticketId/boleta')
  async boleta(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Actor() actor: ActorHttp,
  ) {
    return TicketPresenter.boleta(
      await this.obtenerBoleta.execute({
        ticketId,
        empresaId: actor.empresaId,
        soloAsignadosA: alcance(actor),
      }),
    );
  }

  @Patch(':ticketId')
  @Roles(...ROLES_OFICINA)
  actualizar(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() dto: ActualizarTicketDto,
    @Actor() actor: ActorHttp,
  ) {
    return this.actualizarTicket.execute({
      ticketId,
      usuarioId: actor.usuarioId,
      usuarioNombre: actor.nombre,
      cambios: {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        prioridad: dto.prioridad,
        fijado: dto.fijado,
        clienteId: dto.clienteId,
        tecnicoId: dto.tecnicoId,
        apoyoIds: dto.apoyoIds,
        etiquetaIds: dto.etiquetaIds,
      },
    });
  }

  @Post(':ticketId/iniciar')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  @HttpCode(HttpStatus.OK)
  iniciar(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Actor() actor: ActorHttp,
  ) {
    return this.iniciarTicket.execute({ ticketId, ...quienActua(actor) });
  }

  @Post(':ticketId/enviar-revision')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  @HttpCode(HttpStatus.OK)
  revision(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Actor() actor: ActorHttp,
  ) {
    return this.enviarARevision.execute({ ticketId, ...quienActua(actor) });
  }

  @Post(':ticketId/devolver')
  @Roles(...ROLES_OFICINA)
  @HttpCode(HttpStatus.OK)
  devolver(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Actor() actor: ActorHttp,
  ) {
    return this.devolverTicket.execute({ ticketId, ...quienActua(actor) });
  }

  @Post(':ticketId/resolver')
  @Roles(...ROLES_OFICINA)
  @HttpCode(HttpStatus.OK)
  resolver(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() dto: ResolverTicketDto,
    @Actor() actor: ActorHttp,
  ) {
    return this.resolverTicket.execute({
      ticketId,
      ...quienActua(actor),
      solucionId: dto.solucionId,
      resueltoComo: dto.resueltoComo,
      notasInternas: dto.notasInternas,
    });
  }

  @Post(':ticketId/cancelar')
  @Roles(...ROLES_OFICINA)
  @HttpCode(HttpStatus.OK)
  cancelar(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() dto: CancelarTicketDto,
    @Actor() actor: ActorHttp,
  ) {
    return this.cancelarTicket.execute({
      ticketId,
      ...quienActua(actor),
      motivo: dto.motivo,
    });
  }

  @Post(':ticketId/reabrir')
  @Roles(...ROLES_OFICINA)
  @HttpCode(HttpStatus.OK)
  reabrir(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Actor() actor: ActorHttp,
  ) {
    return this.reabrirTicket.execute({ ticketId, ...quienActua(actor) });
  }
}
