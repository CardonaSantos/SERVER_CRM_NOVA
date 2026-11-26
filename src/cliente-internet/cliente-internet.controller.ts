import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';
import {
  Controller,
  Get,
  Param,
  Query,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ClienteInternetService } from './cliente-internet.service';
import { GetClientesRutaQueryDto } from './pagination/cliente-internet.dto';
import { GetCustomersQueryDto } from './dto/query-table';
import { CustomersCampaingQuery } from './query/customers-campaing-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('internet-customer')
export class ClienteInternetController {
  private readonly logger = new Logger(ClienteInternetService.name);

  constructor(
    private readonly clienteInternetService: ClienteInternetService,
  ) {}

  @Get('/customer-to-table')
  findCustomersToTable(
    @Query(new ValidationPipe({ transform: true }))
    queryParams: GetCustomersQueryDto,
  ) {
    return this.clienteInternetService.findCustomersToTable(queryParams);
  }

  @Get('/get-customer-details/:id')
  findCustomerDetails(@Param('id') id: number) {
    return this.clienteInternetService.getDetallesClienteInternet2(Number(id));
  }

  @Get('/get-customer-to-edit/:id')
  getCustomerToEdit(@Param('id') id: number) {
    return this.clienteInternetService.getCustomerToEdit(Number(id));
  }

  @Get('/get-customers-to-ticket')
  findCustomersToTicket() {
    return this.clienteInternetService.findCustomersToTicket();
  }

  @Get('/whatsapp-campaing')
  getCustomersToWhatsappCampaing(
    @Query(new ValidationPipe({ transform: true }))
    queryParams: CustomersCampaingQuery,
  ) {
    this.logger.log(
      `queryParams recibido:\n${JSON.stringify(queryParams, null, 2)}`,
    );
    return this.clienteInternetService.getCustomersWhatsappCampaing(
      queryParams,
    );
  }

  // COMENTARIO DE ULTIMO COMMIT
  @Get('/get-customers-ruta')
  getCustomersToRuta(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
      }),
    )
    q: GetClientesRutaQueryDto,
  ) {
    this.logger.log(
      `El query enviado desde la tabla es:\n${JSON.stringify(q, null, 2)}`,
    );

    return this.clienteInternetService.getCustomersToRuta(q);
  }
}
