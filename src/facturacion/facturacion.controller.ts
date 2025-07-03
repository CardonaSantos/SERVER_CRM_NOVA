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
} from '@nestjs/common';
import { FacturacionService } from './facturacion.service';
import { CreateFacturacionDto } from './dto/create-facturacion.dto';
import { UpdateFacturacionDto } from './dto/update-facturacion.dto';
import { CreateFacturacionPaymentDto } from './dto/createFacturacionPayment.dto';
import { CreatePaymentOnRuta } from './dto/createPaymentOnRuta.dto';
import { GenerateFactura } from './dto/generateFactura.dto';
import { GenerateFacturaMultipleDto } from './dto/generateMultipleFactura.dto';
import { DeleteFacturaDto } from './dto/delete-one-factura.dto';
import { UpdateFacturaDto } from './dto/update-factura.dto';
import {
  EstadoFactura,
  EstadoFacturaInternet,
  StateFacturaInternet,
} from '@prisma/client';

@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  @Post()
  create(@Body() createFacturacionDto: CreateFacturacionDto) {
    return this.facturacionService.create(createFacturacionDto);
  }

  @Post('/create-new-payment')
  createNewPaymentFacturacion(
    @Body() createFacturacionPaymentDto: CreateFacturacionPaymentDto,
  ) {
    return this.facturacionService.createNewPaymentFacturacion(
      createFacturacionPaymentDto,
    );
  }

  @Post('/create-new-payment-for-ruta')
  createNewPaymentFacturacionForRuta(
    @Body() createFacturacionPaymentDto: CreatePaymentOnRuta,
  ) {
    return this.facturacionService.createNewPaymentFacturacionForRuta(
      createFacturacionPaymentDto,
    );
  }

  //**
  // Generar una factura manualmente
  // */
  @Post('/generate-factura-internet')
  generateFacturaInternet(@Body() createGenerateFactura: GenerateFactura) {
    return this.facturacionService.generateFacturaInternet(
      createGenerateFactura,
    );
  }

  //**
  // Generar facturas manualmente
  // */
  @Post('/generate-factura-internet-multiple')
  generateFacturaMultiple(
    @Body() createFacturaMultipleDto: GenerateFacturaMultipleDto,
  ) {
    return this.facturacionService.generateFacturaMultiple(
      createFacturaMultipleDto,
    );
  }

  @Get()
  findAll() {
    return this.facturacionService.findAll();
  }

  @Get('/get-facturacion-with-payments/:id')
  findOneFacturaWithPayments(@Param('id', ParseIntPipe) id: number) {
    return this.facturacionService.findOneFacturaWithPayments(id);
  }

  @Get('/con-pagos')
  findAllFacturasConPago() {
    return this.facturacionService.findAllFacturasConPago();
  }

  @Get('/factura-to-pdf/:id')
  getInvoiceToPDF(@Param('id', ParseIntPipe) id: number) {
    return this.facturacionService.getFacturaToPDf(id);
  }

  @Get('/facturacion-to-table')
  facturacionToTable(
    @Query('page') page: string,
    @Query('limite') limite: string,
    @Query('paramSearch') paramSearch: string,
    //
    @Query('zonasFacturacionSelected') zonasFacturacionSelected: string,
    @Query('muniSelected') muniSelected: string,
    @Query('depaSelected') depaSelected: string,
    @Query('sectorSelected') sectorSelected: string,

    @Query('estado') estado: StateFacturaInternet,
  ) {
    const pagina = parseInt(page, 10) || 1;
    const limit = parseInt(limite, 10) || 10;

    const zona = parseInt(zonasFacturacionSelected, 10) || null;
    const municipio = parseInt(muniSelected, 10) || null;
    const departamento = parseInt(depaSelected, 10) || null;
    const sector = parseInt(sectorSelected, 10) || null;

    const estadoFactura = estado || null;

    return this.facturacionService.facturacionToTable(
      pagina,
      limit,
      paramSearch,
      //otros datos
      zona,
      municipio,
      departamento,
      sector,
      estadoFactura,
    );
  }

  @Get('/get-factura-to-edit/:id')
  find_factura_to_edit(@Param('id', ParseIntPipe) id: number) {
    return this.facturacionService.find_factura_to_edit(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facturacionService.findOne(+id);
  }

  @Patch('/update-factura/:id')
  updateFactura(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFacturacionDto: UpdateFacturaDto,
  ) {
    return this.facturacionService.updateFactura(id, updateFacturacionDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFacturacionDto: UpdateFacturacionDto,
  ) {
    return this.facturacionService.update(+id, updateFacturacionDto);
  }

  @Delete('/delete-all-march')
  removeAllFacturasMarzo() {
    return this.facturacionService.removeManyFacturasMarch();
  }

  @Delete('/delete-one-factura')
  remove(@Body() deleteFacturaDto: DeleteFacturaDto) {
    console.log('DTO recibido en controller:', deleteFacturaDto);
    return this.facturacionService.removeOneFactura(deleteFacturaDto);
  }
}
