import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GatewayModule } from 'src/web-sockets/websocket.module';
import { ClienteCobranzaModule } from '../cliente-cobranza/cliente-cobranza.module';
import { RutaCobroModule } from '../ruta-cobro/ruta-cobro.module';
import { FacturacionFacade } from './application/facade/facturacion.facade';
import { FACTURACION_EVENTOS } from './application/ports/facturacion-eventos.port';
import { CobranzaDelClienteService } from './application/services/cobranza-del-cliente.service';
import { EmisorFacturasService } from './application/services/emisor-facturas.service';
import { RegistradorPagosService } from './application/services/registrador-pagos.service';
import { EditarFacturaUseCase } from './application/use-cases/editar-factura.use-case';
import { EliminarFacturaUseCase } from './application/use-cases/eliminar-factura.use-case';
import { EliminarPagoUseCase } from './application/use-cases/eliminar-pago.use-case';
import { GenerarFacturaUseCase } from './application/use-cases/generar-factura.use-case';
import { GenerarFacturasUseCase } from './application/use-cases/generar-facturas.use-case';
import { GenerarPrimeraFacturaUseCase } from './application/use-cases/generar-primera-factura.use-case';
import { ListarFacturasEliminadasUseCase } from './application/use-cases/listar-facturas-eliminadas.use-case';
import { ListarFacturasUseCase } from './application/use-cases/listar-facturas.use-case';
import { ObtenerFacturaDetalleUseCase } from './application/use-cases/obtener-factura-detalle.use-case';
import { ObtenerFacturaEdicionUseCase } from './application/use-cases/obtener-factura-edicion.use-case';
import { ObtenerFacturaImpresionUseCase } from './application/use-cases/obtener-factura-impresion.use-case';
import { RegistrarPagoOficinaUseCase } from './application/use-cases/registrar-pago-oficina.use-case';
import { RegistrarPagoRutaUseCase } from './application/use-cases/registrar-pago-ruta.use-case';
import { CLIENTE_FACTURABLE_QUERY } from './domain/ports/cliente-facturable-query.port';
import { FACTURA_QUERY } from './domain/ports/factura-query.port';
import { FACTURA_REPOSITORY } from './domain/ports/factura-repository.port';
import { PAGO_REPOSITORY } from './domain/ports/pago-repository.port';
import { ClienteFacturablePrismaQuery } from './infra/prisma/cliente-facturable-prisma.query';
import { FacturaPrismaQuery } from './infra/prisma/factura-prisma.query';
import { FacturaPrismaRepository } from './infra/prisma/factura-prisma.repository';
import { PagoPrismaRepository } from './infra/prisma/pago-prisma.repository';
import { FacturacionEventosWebsocketAdapter } from './infra/websocket/facturacion-eventos-websocket.adapter';
import { FacturaEliminacionController } from './presentation/http/factura-eliminacion.controller';
import { FacturacionController } from './presentation/http/facturacion.controller';
import { FACTURACION } from './public/facturacion.facade.port';

/**
 * Facturas de internet y sus pagos.
 *
 * API pública (`public/`): la fachada `FACTURACION`.
 */
@Module({
  imports: [
    PrismaModule,
    GatewayModule,
    ClienteCobranzaModule,
    RutaCobroModule,
  ],
  controllers: [FacturacionController, FacturaEliminacionController],
  providers: [
    // Casos de uso
    RegistrarPagoOficinaUseCase,
    RegistrarPagoRutaUseCase,
    EliminarPagoUseCase,
    GenerarFacturaUseCase,
    GenerarFacturasUseCase,
    GenerarPrimeraFacturaUseCase,
    EditarFacturaUseCase,
    EliminarFacturaUseCase,
    ListarFacturasUseCase,
    ListarFacturasEliminadasUseCase,
    ObtenerFacturaDetalleUseCase,
    ObtenerFacturaImpresionUseCase,
    ObtenerFacturaEdicionUseCase,
    // Services
    CobranzaDelClienteService,
    RegistradorPagosService,
    EmisorFacturasService,
    // Fachada
    FacturacionFacade,
    { provide: FACTURACION, useExisting: FacturacionFacade },
    // Adaptadores
    { provide: FACTURA_REPOSITORY, useClass: FacturaPrismaRepository },
    { provide: PAGO_REPOSITORY, useClass: PagoPrismaRepository },
    { provide: FACTURA_QUERY, useClass: FacturaPrismaQuery },
    {
      provide: CLIENTE_FACTURABLE_QUERY,
      useClass: ClienteFacturablePrismaQuery,
    },
    {
      provide: FACTURACION_EVENTOS,
      useClass: FacturacionEventosWebsocketAdapter,
    },
  ],
  exports: [FACTURACION],
})
export class FacturacionModule {}
