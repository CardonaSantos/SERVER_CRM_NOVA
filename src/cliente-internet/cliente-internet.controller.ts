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
import { Response } from 'express';
import { ClienteInternetService } from './cliente-internet.service';
import { CreateClienteInternetDto } from './dto/create-cliente-internet.dto';
import { UpdateClienteInternetDto } from './dto/update-cliente-internet.dto';
// import { JwtAuthGuard } from 'src/auth/JwtGuard/JwtAuthGuard';
import { GetUserAuthToken } from 'src/CustomDecoratorAuthToken/GetUserAuthToken';
import { GetToken } from 'src/auth/JwtGuard/getUserDecorator';
import { updateCustomerService } from './dto/update-customer-service';
import { GetClientesRutaQueryDto } from './pagination/cliente-internet.dto';
// import { IdContratoService } from 'src/id-contrato/id-contrato.service';

@Controller('internet-customer')
export class ClienteInternetController {
  constructor(
    private readonly clienteInternetService: ClienteInternetService,
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
    @Query('page') page: string,
    @Query('limite') limite: string,
    @Query('paramSearch') paramSearch: string,

    //otros filtros
    @Query('zonasFacturacionSelected') zonasFacturacionSelected: string,
    @Query('muniSelected') muniSelected: string,
    @Query('depaSelected') depaSelected: string,
    @Query('sectorSelected') sectorSelected: string,
    //nuevo state
    @Query('estadoSelected') estadoSelected: string,
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limit = parseInt(limite, 10) || 1;
    //otros filtros
    const zona = parseInt(zonasFacturacionSelected, 10) || null;
    const municipio = parseInt(muniSelected, 10) || null;
    const departamento = parseInt(depaSelected, 10) || null;
    const sector = parseInt(sectorSelected, 10) || null;
    const estado = estadoSelected || null;

    return this.clienteInternetService.findCustomersToTable(
      pageNumber,
      limit,
      paramSearch,
      //otro
      zona,
      municipio,
      departamento,
      sector,
      estado,
    );
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
   * ACTUALIZAR CLIENTE
   * @param updateCustomerService DTO de nuevoc cambios
   * @param id
   * @returns
   */
  @Patch('/update-customer/:id')
  updateClienteInternet(
    @Body() updateCustomerService: UpdateClienteInternetDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clienteInternetService.updateClienteInternet(
      id,
      updateCustomerService,
    );
  }
}
