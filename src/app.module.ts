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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
