import { Module } from '@nestjs/common';
import { VerifyCustomerModule } from 'src/credito/verify-customer/verify-customer.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PppoeAccesoInternetModule } from '../pppoe-acceso-internet/pppoe-acceso-internet.module';
import { FacturacionModule } from '../facturacion/facturacion.module';
import { ZonaFacturacionModule } from '../zona-facturacion/zona-facturacion.module';
import { ServicioModule } from '../servicio/servicio.module';
import { ClienteFacade } from './application/facade/cliente.facade';
import { CLASIFICACION_CREDITO } from './application/ports/clasificacion-credito.port';
import { CONTRATO_FISICO } from './application/ports/contrato-fisico.port';
import { ActualizarClienteUseCase } from './application/use-cases/actualizar-cliente.use-case';
import { ActualizarIpClienteUseCase } from './application/use-cases/actualizar-ip-cliente.use-case';
import { CrearClienteUseCase } from './application/use-cases/crear-cliente.use-case';
import { EliminarClienteUseCase } from './application/use-cases/eliminar-cliente.use-case';
import { MarcarClienteDesinstaladoUseCase } from './application/use-cases/marcar-cliente-desinstalado.use-case';
import { SincronizarEstadoOperativoClienteUseCase } from './application/use-cases/sincronizar-estado-operativo-cliente.use-case';
import { CLIENTE_FICHA_QUERY } from './domain/ports/cliente-ficha-query.port';
import { CLIENTE_LISTADO_QUERY } from './domain/ports/cliente-listado-query.port';
import { CLIENTE_REPOSITORY } from './domain/ports/cliente-repository.port';
import { ListarClientesCampaniaUseCase } from './application/use-cases/listar-clientes-campania.use-case';
import { ListarClientesRutaUseCase } from './application/use-cases/listar-clientes-ruta.use-case';
import { ListarClientesUseCase } from './application/use-cases/listar-clientes.use-case';
import { ListarOpcionesClienteUseCase } from './application/use-cases/listar-opciones-cliente.use-case';
import { ObtenerClienteEdicionUseCase } from './application/use-cases/obtener-cliente-edicion.use-case';
import { ObtenerDetalleClienteUseCase } from './application/use-cases/obtener-detalle-cliente.use-case';
import { ClasificacionCreditoVerificacionAdapter } from './infra/credito/clasificacion-credito-verificacion.adapter';
import { ClienteFichaPrismaQuery } from './infra/prisma/cliente-ficha-prisma.query';
import { ClienteListadoPrismaQuery } from './infra/prisma/cliente-listado-prisma.query';
import { ClientePrismaRepository } from './infra/prisma/cliente-prisma.repository';
import { ContratoFisicoPrismaAdapter } from './infra/prisma/contrato-fisico-prisma.adapter';
import { ClienteRedController } from './presentation/http/cliente-red.controller';
import { ClienteController } from './presentation/http/cliente.controller';
import { CLIENTE } from './public/cliente.facade.port';

/**
 * Clientes de internet.
 *
 * API pública (`public/`): la fachada `CLIENTE` y sus tipos.
 */
@Module({
  imports: [
    PrismaModule,
    PppoeAccesoInternetModule,
    VerifyCustomerModule,
    ZonaFacturacionModule,
    FacturacionModule,
    ServicioModule,
  ],
  controllers: [ClienteController, ClienteRedController],
  providers: [
    // Casos de uso
    CrearClienteUseCase,
    ActualizarClienteUseCase,
    ActualizarIpClienteUseCase,
    EliminarClienteUseCase,
    ListarClientesUseCase,
    ListarClientesRutaUseCase,
    ListarClientesCampaniaUseCase,
    ListarOpcionesClienteUseCase,
    ObtenerDetalleClienteUseCase,
    ObtenerClienteEdicionUseCase,
    SincronizarEstadoOperativoClienteUseCase,
    MarcarClienteDesinstaladoUseCase,
    // Fachada
    ClienteFacade,
    { provide: CLIENTE, useExisting: ClienteFacade },
    // Adaptadores
    { provide: CLIENTE_REPOSITORY, useClass: ClientePrismaRepository },
    { provide: CLIENTE_LISTADO_QUERY, useClass: ClienteListadoPrismaQuery },
    { provide: CLIENTE_FICHA_QUERY, useClass: ClienteFichaPrismaQuery },
    { provide: CONTRATO_FISICO, useClass: ContratoFisicoPrismaAdapter },
    {
      provide: CLASIFICACION_CREDITO,
      useClass: ClasificacionCreditoVerificacionAdapter,
    },
  ],
  exports: [CLIENTE],
})
export class ClienteModule {}
