import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import { ClienteInternetService } from './cliente-internet.service';
import { CreateClienteInternetDto } from './dto/create-cliente-internet.dto';
import { UpdateClienteInternetDto } from './dto/update-cliente-internet.dto';
import { updateCustomerService } from './dto/update-customer-service';
import { GetClientesRutaQueryDto } from './pagination/cliente-internet.dto';
import { NetworkServiceService } from 'src/network-service/network-service.service';
import { GetCustomersQueryDto } from './dto/query-table';
// import { IdContratoService } from 'src/id-contrato/id-contrato.service';

@Controller('internet-customer')
export class ClienteInternetController {
  constructor(
    private readonly clienteInternetService: ClienteInternetService,

    private readonly networkService: NetworkServiceService,
  ) {}

  @Post('/create-new-customer')
  create(@Body() createClienteInternetDto: CreateClienteInternetDto) {
    return this.clienteInternetService.create(createClienteInternetDto);
  }

  @Get()
  findAll() {
    return this.clienteInternetService.findAllClientsWithRelations();
  }

  @Get('/customer-to-table')
  findCustomersToTable(
    // @Query('page') page: string,
    // @Query('limite') limite: string,
    // @Query('paramSearch') paramSearch: string,

    // //otros filtros
    // @Query('zonasFacturacionSelected') zonasFacturacionSelected: string,
    // @Query('muniSelected') muniSelected: string,
    // @Query('depaSelected') depaSelected: string,
    // @Query('sectorSelected') sectorSelected: string,
    // //nuevo state
    // @Query('estadoSelected') estadoSelected: string,
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
    return this.clienteInternetService.getCustomersToRuta(q);
  }

  @Get('/cliente-media-dev/:id')
  getCustomerWithMedia(@Param('id', ParseIntPipe) id: number) {
    return this.clienteInternetService.getCustomerWithMedia(id);
  }

  @Delete('/delete-all')
  deleteAllClientesInternet() {
    return this.clienteInternetService.deleteClientsWithRelations();
  }

  @Delete('/delete-one-customer/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clienteInternetService.removeOneCustomer(id);
  }

  @Patch('/customer-update-service')
  updateCustomerService(@Body() updateCustomerService: updateCustomerService) {
    return this.clienteInternetService.updateClienteAddService(
      updateCustomerService,
    );
  }

  /**
   * Actualizar cliente normal inlcluyendo IP
   * @param updateCustomerService DTO de nuevoc cambios
   * @param id
   * @returns
   */
  @Patch('/update-customer/:id')
  async updateClienteInternet(
    @Body() updateCustomerService: UpdateClienteInternetDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.clienteInternetService.updateClienteInternet(
      id,
      updateCustomerService,
    );

    // await this.networkService.syncCustomerNetwork(id);
    return result;
  }
}
