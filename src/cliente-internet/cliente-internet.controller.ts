import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Request,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { ClienteInternetService } from './cliente-internet.service';
import { CreateClienteInternetDto } from './dto/create-cliente-internet.dto';
import { UpdateClienteInternetDto } from './dto/update-cliente-internet.dto';
// import { JwtAuthGuard } from 'src/auth/JwtGuard/JwtAuthGuard';
import { GetUserAuthToken } from 'src/CustomDecoratorAuthToken/GetUserAuthToken';
import { GetToken } from 'src/auth/JwtGuard/getUserDecorator';
import { updateCustomerService } from './dto/update-customer-service';
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
  findCustomersToTable() {
    return this.clienteInternetService.findCustomersToTable();
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
  getCustomersToRuta() {
    return this.clienteInternetService.getCustomersToRuta();
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
