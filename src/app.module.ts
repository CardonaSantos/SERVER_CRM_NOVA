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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
