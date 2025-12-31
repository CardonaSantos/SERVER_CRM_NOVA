import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmpresaModule } from './empresa/empresa.module';
import { LocationModule } from './location/location.module';
import { ClienteInternetModule } from './cliente-internet/cliente-internet.module';
import { ServicioModule } from './servicio/servicio.module';
import { TipoServicioModule } from './tipo-servicio/tipo-servicio.module';
import { ServicioInternetModule } from './servicio-internet/servicio-internet.module';
import { FacturacionZonaModule } from './facturacion-zona/facturacion-zona.module';
import { FacturacionModule } from './facturacion/facturacion.module';
import { TagsTicketModule } from './tags-ticket/tags-ticket.module';
import { TicketsSoporteModule } from './tickets-soporte/tickets-soporte.module';
import { TicketSeguimientoModule } from './ticket-seguimiento/ticket-seguimiento.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ZonaFacturacionCronModule } from './zona-facturacion-cron/zona-facturacion-cron.module';
import { IdContratoModule } from './id-contrato/id-contrato.module';
import { RutaCobroModule } from './ruta-cobro/ruta-cobro.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TwilioModule } from './twilio/twilio.module';
import { CustomerPayloadModule } from './customer-payload/customer-payload.module';
import { SectorModule } from './sector/sector.module';
import { MensajeModule } from './mensaje/mensaje.module';
import { ContratoClienteModule } from './contrato-cliente/contrato-cliente.module';
import { MikroTikModule } from './mikro-tik/mikro-tik.module';
import { TwilioApiModule } from './twilio-api/twilio-api.module';
import { MetasTicketsModule } from './metas-tickets/metas-tickets.module';
import { MetricasTicketsModule } from './metricas-tickets/metricas-tickets.module';
import { FacturaEliminacionModule } from './factura-eliminacion/factura-eliminacion.module';
import { BanruralIntegrationModule } from './banrural-integration/banrural-integration.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DigitalOceanMediaModule } from './modules/digital-ocean-media/digital-ocean-media.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { PerfilUsuarioModule } from './perfil-usuario/perfil-usuario.module';
import { TicketSolucionesModule } from './ticket-soluciones/ticket-soluciones.module';
import { SshMikrotikConnectionModule } from './ssh-mikrotik-connection/ssh-mikrotik-connection.module';
import { OltModule } from './olt/olt.module';
import { FireworksIaModule } from './fireworks-ia/fireworks-ia.module';
import { WhatsappApiMetaModule } from './whatsapp-api-meta/whatsapp-api-meta.module';
import { TwilioMensajesModule } from './twilio-mensajes/twilio-mensajes.module';
import { OpenIaModule } from './open-ia/open-ia.module';
import { GatewayModule } from './web-sockets/websocket.module';
import { TicketResumenModule } from './ticket-resumen/ticket-resumen.module';
import { CloudApiMetaModule } from './cloud-api-meta/cloud-api-meta.module';
import { BroadcastModule } from './broadcast/broadcast.module';
import { BotFunctionsModule } from './bot-functions/bot-functions.module';
import { NotificacionesUsuarioModule } from './notificaciones-usuario/notificaciones-usuario.module';

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
    ClienteInternetModule,
    ServicioModule,
    TipoServicioModule,
    ServicioInternetModule,
    FacturacionZonaModule,
    FacturacionModule,
    TagsTicketModule,
    TicketsSoporteModule,
    TicketSeguimientoModule,
    //PARA EL CRON
    ScheduleModule.forRoot(),
    // TerminusModule,
    ZonaFacturacionCronModule,
    IdContratoModule,
    RutaCobroModule,
    DashboardModule,
    TwilioModule,
    CustomerPayloadModule,
    SectorModule,
    MensajeModule,
    ContratoClienteModule,
    MikroTikModule,
    TwilioApiModule,
    MetasTicketsModule,
    MetricasTicketsModule,
    FacturaEliminacionModule,
    BanruralIntegrationModule,
    ReportsModule,
    DigitalOceanMediaModule,
    NotificacionesModule,
    PerfilUsuarioModule,
    TicketSolucionesModule,
    SshMikrotikConnectionModule,
    OltModule,
    FireworksIaModule,
    WhatsappApiMetaModule,
    TwilioMensajesModule,
    OpenIaModule,
    GatewayModule,
    TicketResumenModule,
    CloudApiMetaModule,
    BroadcastModule,
    BotFunctionsModule,
    NotificacionesUsuarioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
