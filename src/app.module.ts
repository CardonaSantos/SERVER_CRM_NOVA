import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmpresaModule } from './empresa/empresa.module';
import { LocationModule } from './location/location.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { ServicioModule } from './servicio/servicio.module';
import { TipoServicioModule } from './tipo-servicio/tipo-servicio.module';
import { ServicioInternetModule } from './servicio-internet/servicio-internet.module';
import { ZonaFacturacionModule } from './modules/zona-facturacion/zona-facturacion.module';
import { FacturacionModule } from './modules/facturacion/facturacion.module';
import { TagsTicketModule } from './tags-ticket/tags-ticket.module';
import { TicketsSoporteModule } from './tickets-soporte/tickets-soporte.module';
import { TicketSeguimientoModule } from './ticket-seguimiento/ticket-seguimiento.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { authThrottlerOptions } from './auth/throttling/auth-throttling';
import { PasswordModule } from './auth/password/password.module';
import { SesionesModule } from './auth/sesiones/sesiones.module';
import { ValidacionModule } from './common/validacion/validacion.module';
import { ExcepcionesModule } from './common/excepciones/excepciones.module';
import { RelojModule } from './common/reloj/reloj.module';
import { TransaccionModule } from './common/transaccion/transaccion.module';
import { ZonaFacturacionCronModule } from './zona-facturacion-cron/zona-facturacion-cron.module';
import { IdContratoModule } from './id-contrato/id-contrato.module';
import { RutaCobroModule } from './ruta-cobro/ruta-cobro.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SectorModule } from './sector/sector.module';
import { ContratoClienteModule } from './contrato-cliente/contrato-cliente.module';
import { MikroTikModule } from './mikro-tik/mikro-tik.module';
import { MetasTicketsModule } from './metas-tickets/metas-tickets.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AlmacenamientoMediaModule } from './modules/almacenamiento-media/almacenamiento-media.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { TicketSolucionesModule } from './ticket-soluciones/ticket-soluciones.module';
import { MensajeriaClienteModule } from './modules/mensajeria-cliente/mensajeria-cliente.module';
import { GatewayModule } from './web-sockets/websocket.module';
import { TicketResumenModule } from './ticket-resumen/ticket-resumen.module';
import { BotFunctionsModule } from './bot-functions/bot-functions.module';
import { CreditoModule } from './credito/credito.module';
import { CuotasPagoModule } from './credito/cuotas-pago/cuotas-pago.module';
import { GenerateReportsModule } from './generate-reports/generate-reports.module';
import { PerfilModule } from './perfil/perfil.module';
import { ClienteInstalacionModule } from './modules/cliente-instalacion/cliente-instalacion.module';
import { ClienteDesinstalacionModule } from './modules/cliente-desinstalacion/cliente-desinstalacion.module';
import { PppoeAccesoInternetModule } from './modules/pppoe-acceso-internet/pppoe-acceso-internet.module';
import { PppoePerfilHomologacionModule } from './modules/pppoe-perfil-homologacion/pppoe-perfil-homologacion.module';
import { PppoeClienteCuentaModule } from './modules/pppoe-cliente-cuenta/pppoe-cliente-cuenta.module';
import { PppoeCredentialsModule } from './modules/pppoe-credentials/pppoe-credentials.module';
import { PppoeAuditoriaModule } from './modules/pppoe-auditoria/pppoe-auditoria.module';
import { PppoeAutomatizacionModule } from './modules/pppoe-automatizacion/pppoe-automatizacion.module';
import { PppoeOperacionModule } from './modules/pppoe-operacion/pppoe-operacion.module';
import { MikrotikSshModule } from './modules/mikrotik-ssh/mikrotik-ssh.module';
import { MikrotikRouterCredentialsModule } from './modules/mikrotik-router-credentials/mikrotik-router-credentials.module';
import { TicketSoporteConformidadModule } from './modules/ticket-soporte-conformidad/ticket-soporte-conformidad.module';
import { ExcelReportsModule } from './modules/excel-reports/excel-reports.module';
import { RealTimeLocationModule } from './modules/real-time-location/real-time-location.module';
import { PushDispositivosModule } from './push-dispositivos/push-dispositivos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que ConfigService esté disponible en toda la aplicación
    }),
    AuthModule,
    UserModule,
    PrismaModule,
    EmpresaModule,
    LocationModule,
    ClienteModule,
    ServicioModule,
    TipoServicioModule,
    ServicioInternetModule,
    ZonaFacturacionModule,
    FacturacionModule,
    TagsTicketModule,
    TicketsSoporteModule,
    TicketSeguimientoModule,
    //PARA EL CRON
    ScheduleModule.forRoot(),
    // Solo se aplica donde se usa LimitarIntentos*; no es un guard global.
    ThrottlerModule.forRoot(authThrottlerOptions),
    // Global: hash/verificación de contraseñas (scrypt + bcrypt heredado).
    PasswordModule,
    // Global: sesiones y bitácora de auth (JwtAuthGuard y gateway WS).
    SesionesModule,
    // ValidationPipe global (VALIDACION_MODO: observacion | estricto).
    ValidacionModule,
    // Filtro global: los 500 nunca exponen stack ni detalle interno.
    ExcepcionesModule,
    // Global: puerto RELOJ (hora y fecha de negocio en America/Guatemala).
    RelojModule,
    TransaccionModule,
    // TerminusModule,
    ZonaFacturacionCronModule,
    IdContratoModule,
    RutaCobroModule,
    DashboardModule,
    SectorModule,
    ContratoClienteModule,
    MikroTikModule,
    MetasTicketsModule,
    ReportsModule,
    AlmacenamientoMediaModule,
    NotificacionesModule,
    TicketSolucionesModule,
    MensajeriaClienteModule,
    GatewayModule,
    TicketResumenModule,
    BotFunctionsModule,
    CreditoModule,
    CuotasPagoModule,
    GenerateReportsModule,
    PerfilModule,

    ClienteInstalacionModule,
    ClienteDesinstalacionModule,
    PppoeAccesoInternetModule,
    PppoePerfilHomologacionModule,
    PppoeClienteCuentaModule,
    PppoeCredentialsModule,
    PppoeAuditoriaModule,
    PppoeAutomatizacionModule,
    PppoeOperacionModule,
    MikrotikSshModule,
    MikrotikRouterCredentialsModule,
    TicketSoporteConformidadModule,
    ExcelReportsModule,
    RealTimeLocationModule,
    PushDispositivosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
