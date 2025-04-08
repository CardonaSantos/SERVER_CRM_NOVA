import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { FacturacionService } from './facturacion.service';
import { CreateFacturacionDto } from './dto/create-facturacion.dto';
import { UpdateFacturacionDto } from './dto/update-facturacion.dto';
import { CreateFacturacionPaymentDto } from './dto/createFacturacionPayment.dto';
import { CreatePaymentOnRuta } from './dto/createPaymentOnRuta.dto';
import { GenerateFactura } from './dto/generateFactura.dto';
import { GenerateFacturaMultipleDto } from './dto/generateMultipleFactura.dto';
import { DeleteFacturaDto } from './dto/delete-one-factura.dto';

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

  @Post('/generate-factura-internet')
  generateFacturaInternet(@Body() createGenerateFactura: GenerateFactura) {
    return this.facturacionService.generateFacturaInternet(
      createGenerateFactura,
    );
  }

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
  facturacionToTable() {
    return this.facturacionService.facturacionToTable();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facturacionService.findOne(+id);
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
    return this.facturacionService.removeOneFactura(deleteFacturaDto);
  }
}
