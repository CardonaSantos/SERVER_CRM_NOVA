import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AlmacenamientoMediaModule } from '../almacenamiento-media/almacenamiento-media.module';
import { MensajeriaClienteModule } from '../mensajeria-cliente/mensajeria-cliente.module';
import { NotificacionModule } from '../notificacion/notificacion.module';
import { TicketSoporteHistorialModule } from '../ticket-soporte-historial/ticket-soporte-historial.module';
import { IMAGEN_COMENTARIO } from './application/ports/imagen-comentario.port';
import { TICKET_AVISOS } from './application/ports/ticket-avisos.port';
import { AccesoTicketService } from './application/services/acceso-ticket.service';
import { ReferenciasTicketService } from './application/services/referencias-ticket.service';
import { TransicionTicketService } from './application/services/transicion-ticket.service';
import { ActualizarEtiquetaTicketUseCase } from './application/use-cases/actualizar-etiqueta-ticket.use-case';
import { ActualizarSolucionTicketUseCase } from './application/use-cases/actualizar-solucion-ticket.use-case';
import { ActualizarTicketUseCase } from './application/use-cases/actualizar-ticket.use-case';
import { CancelarTicketUseCase } from './application/use-cases/cancelar-ticket.use-case';
import { ComentarTicketUseCase } from './application/use-cases/comentar-ticket.use-case';
import { ContarTicketsUseCase } from './application/use-cases/contar-tickets.use-case';
import { CrearEtiquetaTicketUseCase } from './application/use-cases/crear-etiqueta-ticket.use-case';
import { CrearSolucionTicketUseCase } from './application/use-cases/crear-solucion-ticket.use-case';
import { CrearTicketBotUseCase } from './application/use-cases/crear-ticket-bot.use-case';
import { CrearTicketUseCase } from './application/use-cases/crear-ticket.use-case';
import { DevolverTicketUseCase } from './application/use-cases/devolver-ticket.use-case';
import { EditarComentarioTicketUseCase } from './application/use-cases/editar-comentario-ticket.use-case';
import { EliminarComentarioTicketUseCase } from './application/use-cases/eliminar-comentario-ticket.use-case';
import { EliminarEtiquetaTicketUseCase } from './application/use-cases/eliminar-etiqueta-ticket.use-case';
import { EliminarSolucionTicketUseCase } from './application/use-cases/eliminar-solucion-ticket.use-case';
import { EnviarTicketARevisionUseCase } from './application/use-cases/enviar-ticket-a-revision.use-case';
import { IniciarTicketUseCase } from './application/use-cases/iniciar-ticket.use-case';
import { ListarActividadTicketUseCase } from './application/use-cases/listar-actividad-ticket.use-case';
import { ListarEtiquetasTicketUseCase } from './application/use-cases/listar-etiquetas-ticket.use-case';
import { ListarOpcionesTicketUseCase } from './application/use-cases/listar-opciones-ticket.use-case';
import { ListarSolucionesTicketUseCase } from './application/use-cases/listar-soluciones-ticket.use-case';
import { ListarTicketsUseCase } from './application/use-cases/listar-tickets.use-case';
import { ObtenerBoletaTicketUseCase } from './application/use-cases/obtener-boleta-ticket.use-case';
import { ObtenerTicketUseCase } from './application/use-cases/obtener-ticket.use-case';
import { QuitarImagenComentarioTicketUseCase } from './application/use-cases/quitar-imagen-comentario-ticket.use-case';
import { ReabrirTicketUseCase } from './application/use-cases/reabrir-ticket.use-case';
import { ResolverTicketUseCase } from './application/use-cases/resolver-ticket.use-case';
import { CATALOGO_TICKET_QUERY } from './domain/ports/catalogo-ticket-query.port';
import { COMENTARIO_TICKET_REPOSITORY } from './domain/ports/comentario-ticket-repository.port';
import { ETIQUETA_TICKET_REPOSITORY } from './domain/ports/etiqueta-ticket-repository.port';
import { SOLUCION_TICKET_REPOSITORY } from './domain/ports/solucion-ticket-repository.port';
import { TICKET_QUERY } from './domain/ports/ticket-query.port';
import { TICKET_REFERENCIA_QUERY } from './domain/ports/ticket-referencia-query.port';
import { TICKET_REPOSITORY } from './domain/ports/ticket-repository.port';
import { ImagenComentarioAlmacenamientoAdapter } from './infra/almacenamiento/imagen-comentario-almacenamiento.adapter';
import { TicketAvisosNotificacionAdapter } from './infra/notificacion/ticket-avisos-notificacion.adapter';
import { CatalogoTicketPrismaQuery } from './infra/prisma/catalogo-ticket-prisma.query';
import { ComentarioTicketPrismaRepository } from './infra/prisma/comentario-ticket-prisma.repository';
import { EtiquetaTicketPrismaRepository } from './infra/prisma/etiqueta-ticket-prisma.repository';
import { SolucionTicketPrismaRepository } from './infra/prisma/solucion-ticket-prisma.repository';
import { TicketPrismaQuery } from './infra/prisma/ticket-prisma.query';
import { TicketPrismaRepository } from './infra/prisma/ticket-prisma.repository';
import { TicketReferenciaPrismaQuery } from './infra/prisma/ticket-referencia-prisma.query';
import { ComentarioTicketController } from './presentation/http/comentario-ticket.controller';
import { TicketBotController } from './presentation/http/ticket-bot.controller';
import { TicketEtiquetaController } from './presentation/http/ticket-etiqueta.controller';
import { TicketSolucionController } from './presentation/http/ticket-solucion.controller';
import { TicketSoporteController } from './presentation/http/ticket-soporte.controller';

/**
 * Tickets de soporte: ciclo de atención, comentarios, etiquetas y soluciones.
 * La bitácora y la conformidad viven en sus propios módulos.
 */
@Module({
  imports: [
    PrismaModule,
    TicketSoporteHistorialModule,
    MensajeriaClienteModule,
    AlmacenamientoMediaModule,
    NotificacionModule,
  ],
  controllers: [
    TicketSoporteController,
    ComentarioTicketController,
    TicketEtiquetaController,
    TicketSolucionController,
    TicketBotController,
  ],
  providers: [
    // Casos de uso
    CrearTicketUseCase,
    CrearTicketBotUseCase,
    ActualizarTicketUseCase,
    IniciarTicketUseCase,
    EnviarTicketARevisionUseCase,
    DevolverTicketUseCase,
    ResolverTicketUseCase,
    CancelarTicketUseCase,
    ReabrirTicketUseCase,
    ListarTicketsUseCase,
    ContarTicketsUseCase,
    ObtenerTicketUseCase,
    ListarActividadTicketUseCase,
    ObtenerBoletaTicketUseCase,
    ListarOpcionesTicketUseCase,
    ComentarTicketUseCase,
    EditarComentarioTicketUseCase,
    QuitarImagenComentarioTicketUseCase,
    EliminarComentarioTicketUseCase,
    ListarEtiquetasTicketUseCase,
    CrearEtiquetaTicketUseCase,
    ActualizarEtiquetaTicketUseCase,
    EliminarEtiquetaTicketUseCase,
    ListarSolucionesTicketUseCase,
    CrearSolucionTicketUseCase,
    ActualizarSolucionTicketUseCase,
    EliminarSolucionTicketUseCase,

    // Services
    AccesoTicketService,
    ReferenciasTicketService,
    TransicionTicketService,

    // Adaptadores
    { provide: TICKET_REPOSITORY, useClass: TicketPrismaRepository },
    { provide: TICKET_QUERY, useClass: TicketPrismaQuery },
    { provide: TICKET_REFERENCIA_QUERY, useClass: TicketReferenciaPrismaQuery },
    {
      provide: COMENTARIO_TICKET_REPOSITORY,
      useClass: ComentarioTicketPrismaRepository,
    },
    {
      provide: ETIQUETA_TICKET_REPOSITORY,
      useClass: EtiquetaTicketPrismaRepository,
    },
    {
      provide: SOLUCION_TICKET_REPOSITORY,
      useClass: SolucionTicketPrismaRepository,
    },
    { provide: CATALOGO_TICKET_QUERY, useClass: CatalogoTicketPrismaQuery },
    { provide: TICKET_AVISOS, useClass: TicketAvisosNotificacionAdapter },
    {
      provide: IMAGEN_COMENTARIO,
      useClass: ImagenComentarioAlmacenamientoAdapter,
    },
  ],
})
export class TicketSoporteModule {}
