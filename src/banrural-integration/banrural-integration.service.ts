import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBanruralIntegrationDto } from './dto/create-banrural-integration.dto';
import { UpdateBanruralIntegrationDto } from './dto/update-banrural-integration.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetClienteInfoDto } from './dto/get-cliente.dto';
import {
  ClienteInfoResponse,
  ConsultaResponse,
  FacturaPendiente,
  FacturasResponse,
} from './utils/interfacesCliente.interface';
import { formattDateForIntegration } from './utils/functions';
import { GetConsultaDto } from './dto/get-consulta.dto';
import { IniciarPagoDto } from './dto/operation.dto';
import { FacturacionService } from 'src/facturacion/facturacion.service';
import { v4 as uuidv4 } from 'uuid';
import {
  IniciarPagoResponse,
  SuccessResponsePago,
} from './utils/interfacesOperation.interface';

@Injectable()
export class BanruralIntegrationService {
  private readonly logger = new Logger(BanruralIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly facturacion: FacturacionService,
  ) {}

  /**
   *
   * @param dto ID del client o Codigo Unico del cliente (identificador)
   * @returns Informacion sobre el cliente que el banco consulta
   */
  async getClienteInfo(dto: GetClienteInfoDto): Promise<ClienteInfoResponse> {
    if (!dto.clienteId && !dto.codigoUnico) {
      throw new BadRequestException({
        success: 0,
        status: 400,
        error: 'Se requiere clienteId o codigoUnico',
      });
    }

    const where = dto.clienteId
      ? { id: dto.clienteId }
      : { codigoUnico: dto.codigoUnico };

    let cliente;
    try {
      cliente = await this.prisma.clienteInternet.findUnique({
        where: {
          id: dto.clienteId,
        },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          dpi: true,
          telefono: true,
          direccion: true,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException({
        success: 0,
        status: 500,
        error: 'Error interno al consultar el cliente',
      });
    }

    if (!cliente) {
      throw new NotFoundException({
        success: 0,
        status: 404,
        error: 'Cliente no encontrado',
      });
    }

    return {
      success: 1,
      status: 200,
      data: {
        id: cliente.id,
        nombre: `${cliente.nombre} ${cliente.apellidos}`,
        direccion: cliente.direccion,
        dpi: cliente.dpi,
        telefono: cliente.telefono,
      },
    };
  }

  async consultaPago(dto: GetConsultaDto): Promise<ConsultaResponse> {
    if (!dto.clienteId && !dto.codigoUnico) {
      throw new BadRequestException({
        success: 0,
        status: 400,
        error: 'Se requiere clienteId o codigoUnico',
      });
    }

    // const whereCliente = dto.clienteId
    //   ? { id: dto.clienteId }
    //   : {
    //       /* codigoUnico: dto.codigoUnico! */
    //     };

    let cliente;
    try {
      cliente = await this.prisma.clienteInternet.findUnique({
        where: {
          id: dto.clienteId,
        },
        select: {
          facturaInternet: {
            where: {
              estadoFacturaInternet: { in: ['PENDIENTE', 'VENCIDA'] },
            },
            select: {
              id: true,
              montoPago: true,
              fechaPagoEsperada: true,
              detalleFactura: true,
              periodo: true,
            },
          },
        },
      });
    } catch (err) {
      throw new InternalServerErrorException({
        success: 0,
        status: 500,
        error: 'Error interno al consultar facturas',
      });
    }

    if (!cliente) {
      throw new NotFoundException({
        success: 0,
        status: 404,
        error: 'Cliente no encontrado',
      });
    }

    const facturas: FacturaPendiente[] = cliente.facturaInternet.map((f) => ({
      facturaId: f.id,
      monto: f.montoPago,
      fechaPagoEsperada: formattDateForIntegration(
        f.fechaPagoEsperada.toISOString(),
      ),
      detalleFactura: f.detalleFactura,
      periodo: f.periodo,
    }));

    return {
      success: 1,
      status: 200,
      data: facturas,
    };
  }

  /**
   *
   * @param dto Dto desde banrural para generar nuestro pago
   * @returns Datos que banrural necesita
   */
  async registrarPago(dto: IniciarPagoDto): Promise<IniciarPagoResponse> {
    const [cliente, factura] = await Promise.all([
      this.prisma.clienteInternet.findUnique({ where: { id: dto.clienteId } }),
      this.prisma.facturaInternet.findUnique({ where: { id: dto.facturaId } }),
    ]);

    if (!cliente) {
      throw new NotFoundException({
        success: 0,
        status: 404,
        error: 'Cliente no encontrado',
      });
    }

    if (!factura) {
      throw new NotFoundException({
        success: 0,
        status: 404,
        error: `Factura ${dto.facturaId} no encontrada`,
      });
    }

    if (factura.estadoFacturaInternet !== 'PENDIENTE') {
      throw new BadRequestException({
        success: 0,
        status: 400,
        error: 'La factura no está pendiente de pago',
      });
    }

    if (dto.monto > factura.saldoPendiente /* o factura.montoPago */) {
      throw new BadRequestException({
        success: 0,
        status: 400,
        error: 'El monto excede el saldo pendiente de la factura',
      });
    }

    const codigoConfirmacion = uuidv4();

    let newPayment;
    try {
      newPayment = await this.facturacion.generatePagoFromBanrural(
        dto as any,
        codigoConfirmacion,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException({
        success: 0,
        status: 500,
        error: 'Error al generar el pago en el sistema CRM',
      });
    }

    // 5.a) Saldo pendiente de la factura específica
    const facturaActualizada = await this.prisma.facturaInternet.findUnique({
      where: { id: dto.facturaId },
      select: { saldoPendiente: true },
    });
    const saldoFacturaRestante = facturaActualizada?.saldoPendiente ?? 0;

    const agg = await this.prisma.facturaInternet.aggregate({
      _sum: { saldoPendiente: true },
      where: {
        clienteId: dto.clienteId,
        estadoFacturaInternet: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
      },
    });
    const saldoTotalPendiente = agg._sum.saldoPendiente ?? 0;

    const responseData: SuccessResponsePago = {
      facturaId: newPayment.facturaInternetId,
      confirmacionBanco: codigoConfirmacion,
      saldoFacturaRestante,
      saldoTotalPendiente,
    };

    return {
      success: 1,
      status: 200,
      data: responseData,
    };
  }
}
