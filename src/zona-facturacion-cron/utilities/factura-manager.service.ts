import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ClienteInternet,
  EstadoCliente,
  FacturacionZona,
  FacturaInternet,
  Prisma,
  ServicioInternet,
  StateFacturaInternet,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
import { dayjs } from 'src/Utils/dayjs.config';
import {
  calcularFechaPagoEsperada,
  calcularPeriodo,
  ESTADOS_FACTURA_PENDIENTE,
  getEstadoCobranza,
  TZ_FACTURACION,
} from '../helpers/Functions';

export type ClienteFacturableActual = Pick<
  ClienteInternet,
  | 'id'
  | 'empresaId'
  | 'nombre'
  | 'apellidos'
  | 'telefono'
  | 'isEliminado'
  | 'desinstaladoEn'
  | 'estadoCliente'
  | 'estadoCobranza'
  | 'enviarRecordatorio'
> & {
  servicioInternet: Pick<ServicioInternet, 'id' | 'nombre' | 'precio'>;
};

@Injectable()
export class FacturacionUtilitiesService {
  private readonly logger = new Logger(FacturacionUtilitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudApi: CloudApiMetaService,
  ) {}

  async obtenerOcrearFactura(
    clienteId: number,
    zona: FacturacionZona,
    crearSiNoExiste = true,
  ): Promise<{ factura: FacturaInternet; esNueva: boolean }> {
    const clienteDb = await this.obtenerClienteFacturableActual(clienteId);

    const periodo = calcularPeriodo(zona);

    const existente = await this.prisma.facturaInternet.findFirst({
      where: {
        clienteId: clienteDb.id,
        facturacionZonaId: zona.id,
        periodo,
      },
    });

    if (existente) {
      return { factura: existente, esNueva: false };
    }

    if (!crearSiNoExiste) {
      throw new NotFoundException('Factura del periodo no encontrada.');
    }

    await this.validarSinFacturaAdelantadaPagada(
      clienteDb.id,
      zona.id,
      periodo,
    );

    return this.crearFacturaPeriodo(clienteDb, zona, periodo);
  }

  async crearFacturaCronMain(
    clienteId: number,
    zona: FacturacionZona,
  ): Promise<{
    factura: FacturaInternet;
    esNueva: boolean;
    notificar: boolean;
  }> {
    const clienteDb = await this.obtenerClienteFacturableActual(clienteId);

    const periodo = calcularPeriodo(zona);

    const existente = await this.prisma.facturaInternet.findFirst({
      where: {
        clienteId: clienteDb.id,
        facturacionZonaId: zona.id,
        periodo,
      },
    });

    if (existente) {
      const notificar = ESTADOS_FACTURA_PENDIENTE.includes(
        existente.estadoFacturaInternet,
      );

      return {
        factura: existente,
        esNueva: false,
        notificar,
      };
    }

    await this.validarSinFacturaAdelantadaPagada(
      clienteDb.id,
      zona.id,
      periodo,
    );

    const { factura, esNueva } = await this.crearFacturaPeriodo(
      clienteDb,
      zona,
      periodo,
    );

    return {
      factura,
      esNueva,
      notificar: ESTADOS_FACTURA_PENDIENTE.includes(
        factura.estadoFacturaInternet,
      ),
    };
  }

  async actualizarEstadoCobranzaCliente(
    factura: FacturaInternet,
  ): Promise<void> {
    const cliente = await this.prisma.clienteInternet.findUnique({
      where: { id: factura.clienteId },
      select: {
        id: true,
        estadoCliente: true,
      },
    });

    if (!cliente) return;

    if (cliente.estadoCliente !== EstadoCliente.ACTIVO) {
      this.logger.debug(
        `Cliente ${cliente.id} no está ACTIVO; no se actualiza cobranza.`,
      );
      return;
    }

    const pendientes = await this.prisma.facturaInternet.count({
      where: {
        clienteId: factura.clienteId,
        estadoFacturaInternet: {
          in: ESTADOS_FACTURA_PENDIENTE,
        },
      },
    });

    await this.prisma.clienteInternet.update({
      where: { id: factura.clienteId },
      data: {
        estadoCobranza: getEstadoCobranza(pendientes),
      },
    });
  }

  async enviarWhatsAppFacturaMeta(
    clienteId: number,
    factura: FacturaInternet,
    templateName: string,
  ): Promise<number> {
    const cliente = await this.obtenerClienteFacturableActual(clienteId);

    if (!cliente.enviarRecordatorio) {
      return 0;
    }

    const empresa = await this.prisma.empresa.findFirst({
      where: { id: cliente.empresaId ?? undefined },
      select: { nombre: true },
    });

    const mesFactura = dayjs(factura.fechaPagoEsperada)
      .tz(TZ_FACTURACION)
      .locale('es')
      .format('MMMM YYYY')
      .toUpperCase();

    const telefonos = formatearTelefonosMeta([cliente.telefono]);
    const destinosUnicos = Array.from(new Set(telefonos));

    if (destinosUnicos.length === 0) {
      return 0;
    }

    const variablesPlantilla = [
      `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
        'Nombre no disponible',
      empresa?.nombre ?? 'Nova Sistemas S.A.',
      mesFactura,
    ];

    let enviados = 0;

    for (const tel of destinosUnicos) {
      const payload = this.cloudApi.crearPayloadTicket(
        tel,
        templateName,
        variablesPlantilla,
      );

      const resp = await this.cloudApi.enviarMensaje(payload);
      const msgId = resp?.messages?.[0]?.id;

      if (msgId) enviados++;

      this.logger.log(
        `Factura notificada a ${tel}${msgId ? ` (msgId: ${msgId})` : ''}`,
      );
    }

    return enviados;
  }

  private async crearFacturaPeriodo(
    clienteDb: ClienteFacturableActual,
    zona: FacturacionZona,
    periodo: string,
  ): Promise<{ factura: FacturaInternet; esNueva: boolean }> {
    const fechaPago = calcularFechaPagoEsperada(zona, periodo);

    const mesYAnio = dayjs(fechaPago)
      .tz(TZ_FACTURACION)
      .locale('es')
      .format('MMMM YYYY')
      .toUpperCase();

    const plan = clienteDb.servicioInternet.nombre;
    const monto = clienteDb.servicioInternet.precio.toFixed(2);

    const detalleFactura = `Factura correspondiente a ${mesYAnio} por Q${monto} | ${plan}`;

    try {
      const factura = await this.prisma.facturaInternet.create({
        data: {
          periodo,
          fechaPagoEsperada: fechaPago,
          montoPago: clienteDb.servicioInternet.precio,
          saldoPendiente: clienteDb.servicioInternet.precio,
          estadoFacturaInternet: StateFacturaInternet.PENDIENTE,
          cliente: { connect: { id: clienteDb.id } },
          facturacionZona: { connect: { id: zona.id } },
          nombreClienteFactura:
            `${clienteDb.nombre} ${clienteDb.apellidos ?? ''}`.trim(),
          detalleFactura,
          empresa: { connect: { id: zona.empresaId } },
        },
      });

      return { factura, esNueva: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existente = await this.prisma.facturaInternet.findFirst({
          where: {
            clienteId: clienteDb.id,
            facturacionZonaId: zona.id,
            periodo,
          },
        });

        if (existente) {
          return { factura: existente, esNueva: false };
        }
      }

      throw error;
    }
  }

  private async obtenerClienteFacturableActual(
    clienteId: number,
  ): Promise<ClienteFacturableActual> {
    const cliente = await this.prisma.clienteInternet.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        empresaId: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        isEliminado: true,
        desinstaladoEn: true,
        estadoCliente: true,
        estadoCobranza: true,
        enviarRecordatorio: true,
        servicioInternet: {
          select: {
            id: true,
            nombre: true,
            precio: true,
          },
        },
      },
    });

    if (!cliente) {
      throw new BadRequestException('Cliente no encontrado.');
    }

    if (cliente.isEliminado) {
      throw new BadRequestException('Cliente eliminado; no se factura.');
    }

    if (cliente.desinstaladoEn) {
      throw new BadRequestException('Cliente desinstalado; no se factura.');
    }

    if (cliente.estadoCliente !== EstadoCliente.ACTIVO) {
      throw new BadRequestException(
        `Cliente no facturable. Estado operativo: ${cliente.estadoCliente}.`,
      );
    }

    if (!cliente.servicioInternet) {
      throw new BadRequestException('Cliente sin servicio de internet.');
    }

    return cliente;
  }

  private async validarSinFacturaAdelantadaPagada(
    clienteId: number,
    facturacionZonaId: number,
    periodo: string,
  ): Promise<void> {
    const adelantada = await this.prisma.facturaInternet.findFirst({
      where: {
        clienteId,
        facturacionZonaId,
        periodo: {
          gt: periodo,
        },
        estadoFacturaInternet: StateFacturaInternet.PAGADA,
      },
    });

    if (adelantada) {
      throw new InternalServerErrorException('Cliente pagado adelantado.');
    }
  }
}
