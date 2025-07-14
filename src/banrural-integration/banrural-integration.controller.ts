import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { BanruralIntegrationService } from './banrural-integration.service';
import { CreateBanruralIntegrationDto } from './dto/create-banrural-integration.dto';
import { UpdateBanruralIntegrationDto } from './dto/update-banrural-integration.dto';
import { GetClienteInfoDto } from './dto/get-cliente.dto';
import {
  ClienteInfoResponse,
  ConsultaResponse,
} from './utils/interfacesCliente.interface';
import { IniciarPagoDto } from './dto/operation.dto';
import { IniciarPagoResponse } from './utils/interfacesOperation.interface';

@Controller('banrural-integration')
export class BanruralIntegrationController {
  constructor(
    private readonly banruralIntegrationService: BanruralIntegrationService,
  ) {}

  /**
   *
   * @param clienteId
   * @param codigoUnico
   * @returns Informacion del cliente para vista previa
   */
  @Get('get-cliente-info')
  @HttpCode(200) // Siempre devuelve 200 en éxito
  getClienteInfo(
    @Query(
      'clienteId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    clienteId?: number,
    @Query('codigoUnico') codigoUnico?: string,
  ) {
    return this.banruralIntegrationService.getClienteInfo({
      clienteId,
      codigoUnico,
    });
  }

  /**
   *
   * @param clienteId
   * @param codigoUnico
   * @returns Informacion sobre las facturas pendientes del cliente
   */
  @Get('transaccion-consulta')
  @HttpCode(200) // Siempre devuelve 200 en éxito
  consulta(
    @Query(
      'clienteId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    clienteId?: number,
    @Query('codigoUnico') codigoUnico?: string,
  ): Promise<ConsultaResponse> {
    return this.banruralIntegrationService.consultaPago({
      clienteId,
      codigoUnico,
    });
  }

  @Post('transaccion-pago')
  @HttpCode(200)
  iniciarPago(@Body() dto: IniciarPagoDto): Promise<IniciarPagoResponse> {
    return this.banruralIntegrationService.registrarPago(dto);
  }
}
