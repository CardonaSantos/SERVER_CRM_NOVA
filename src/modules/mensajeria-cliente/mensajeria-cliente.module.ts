import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MensajeriaClienteFacade } from './application/facade/mensajeria-cliente.facade';
import { MENSAJERIA_CLIENTE_EVENTOS } from './application/ports/mensajeria-cliente-eventos.port';
import { PROVEEDOR_MENSAJES } from './application/ports/proveedor-mensajes.port';
import { PROVEEDOR_PLANTILLAS } from './application/ports/proveedor-plantillas.port';
import { DespachadorCampaniasService } from './application/services/despachador-campanias.service';
import { AvisarMensajeBotUseCase } from './application/use-cases/avisar-mensaje-bot.use-case';
import { CrearCampaniaUseCase } from './application/use-cases/crear-campania.use-case';
import { CrearPlantillaImagenUseCase } from './application/use-cases/crear-plantilla-imagen.use-case';
import { CrearPlantillaUseCase } from './application/use-cases/crear-plantilla.use-case';
import { EjecutarCampaniaUseCase } from './application/use-cases/ejecutar-campania.use-case';
import { EliminarPlantillaUseCase } from './application/use-cases/eliminar-plantilla.use-case';
import { EnviarPlantillaUseCase } from './application/use-cases/enviar-plantilla.use-case';
import { ListarCampaniasUseCase } from './application/use-cases/listar-campanias.use-case';
import { ListarEnviosCampaniaUseCase } from './application/use-cases/listar-envios-campania.use-case';
import { ListarPlantillasUseCase } from './application/use-cases/listar-plantillas.use-case';
import { ObtenerCampaniaUseCase } from './application/use-cases/obtener-campania.use-case';
import { ReanudarCampaniaUseCase } from './application/use-cases/reanudar-campania.use-case';
import { SubirImagenPlantillaUseCase } from './application/use-cases/subir-imagen-plantilla.use-case';
import { CAMPANIA_QUERY } from './domain/ports/campania-query.port';
import { CAMPANIA_REPOSITORY } from './domain/ports/campania-repository.port';
import { DESTINATARIO_QUERY } from './domain/ports/destinatario-query.port';
import { MetaGraphAdapter } from './infra/meta/meta-graph.adapter';
import { ProveedorMensajesMetaAdapter } from './infra/meta/proveedor-mensajes-meta.adapter';
import { ProveedorPlantillasMetaAdapter } from './infra/meta/proveedor-plantillas-meta.adapter';
import { CampaniaPrismaQuery } from './infra/prisma/campania-prisma.query';
import { CampaniaPrismaRepository } from './infra/prisma/campania-prisma.repository';
import { DestinatarioPrismaQuery } from './infra/prisma/destinatario-prisma.query';
import { MensajeriaClienteEventosWebsocketAdapter } from './infra/websocket/mensajeria-cliente-eventos-websocket.adapter';
import { CampaniaWhatsappController } from './presentation/http/campania-whatsapp.controller';
import { MensajeBotController } from './presentation/http/mensaje-bot.controller';
import { PlantillaWhatsappController } from './presentation/http/plantilla-whatsapp.controller';
import { WebhookMetaController } from './presentation/http/webhook-meta.controller';
import { MENSAJERIA_CLIENTE } from './public/mensajeria-cliente.facade.port';

/**
 * Mensajes de WhatsApp a clientes: plantillas, campañas y avisos. Meta es un
 * adaptador.
 *
 * API pública (`public/`): la fachada `MENSAJERIA_CLIENTE`.
 */
@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [
    PlantillaWhatsappController,
    CampaniaWhatsappController,
    WebhookMetaController,
    MensajeBotController,
  ],
  providers: [
    // Casos de uso
    ListarPlantillasUseCase,
    CrearPlantillaUseCase,
    CrearPlantillaImagenUseCase,
    SubirImagenPlantillaUseCase,
    EliminarPlantillaUseCase,
    EnviarPlantillaUseCase,
    CrearCampaniaUseCase,
    EjecutarCampaniaUseCase,
    ReanudarCampaniaUseCase,
    ListarCampaniasUseCase,
    ObtenerCampaniaUseCase,
    ListarEnviosCampaniaUseCase,
    AvisarMensajeBotUseCase,
    // Services
    DespachadorCampaniasService,
    // Fachada
    MensajeriaClienteFacade,
    { provide: MENSAJERIA_CLIENTE, useExisting: MensajeriaClienteFacade },
    // Adaptadores
    MetaGraphAdapter,
    { provide: PROVEEDOR_MENSAJES, useClass: ProveedorMensajesMetaAdapter },
    { provide: PROVEEDOR_PLANTILLAS, useClass: ProveedorPlantillasMetaAdapter },
    { provide: CAMPANIA_REPOSITORY, useClass: CampaniaPrismaRepository },
    { provide: CAMPANIA_QUERY, useClass: CampaniaPrismaQuery },
    { provide: DESTINATARIO_QUERY, useClass: DestinatarioPrismaQuery },
    {
      provide: MENSAJERIA_CLIENTE_EVENTOS,
      useClass: MensajeriaClienteEventosWebsocketAdapter,
    },
  ],
  exports: [MENSAJERIA_CLIENTE],
})
export class MensajeriaClienteModule {}
