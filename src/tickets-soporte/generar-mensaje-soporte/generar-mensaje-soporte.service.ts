import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwilioService } from 'src/twilio/twilio.service';

@Injectable()
export class GenerarMensajeSoporteService {
  private readonly logger = new Logger(GenerarMensajeSoporteService.name);
  constructor(
    private readonly twilio: TwilioService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,

    private readonly cloudapi: CloudApiMetaService,
  ) {}

  async GenerarMensajeTicketSoporte(clienteId: number, ticketId: number) {
    const TEMPLATE_SID = this.configService.get<string>(
      'TICKET_SOPORTE_CREADO_SID',
    );

    if (!TEMPLATE_SID) {
      throw new BadRequestException(
        'No se ha configurado el SID del template de WhatsApp para tickets de soporte',
      );
    }

    // 1) Primero verificar que llegue un clienteId válido
    if (!clienteId) {
      throw new BadRequestException('Sin id del cliente');
    }

    // 2) Buscar el cliente y arrojar excepción si no existe
    const cliente = await this.prisma.clienteInternet.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        contactoReferenciaTelefono: true,
        empresaId: true,
      },
    });
    if (!cliente) {
      throw new NotFoundException(
        `No se encontró clienteInternet con id ${clienteId}`,
      );
    }

    // 3) Buscar el ticket y validar
    const ticket = await this.prisma.ticketSoporte.findUnique({
      where: { id: ticketId },
      select: { id: true, titulo: true, descripcion: true },
    });
    if (!ticket) {
      throw new NotFoundException(
        `No se encontró ticketSoporte con id ${ticketId}`,
      );
    }

    // 4) Buscar la empresa asociada al cliente y validar
    const empresax = await this.prisma.empresa.findUnique({
      where: { id: cliente.empresaId },
      select: { id: true, nombre: true, direccion: true },
    });
    if (!empresax) {
      throw new NotFoundException(
        `No se encontró empresa con id ${cliente.empresaId}`,
      );
    }

    // Ahora sí podemos usar cliente.id, cliente.nombre, etc., sabiendo que no son null
    const clientInfo = {
      id: cliente.id,
      nombres: cliente.nombre,
      apellidos: cliente.apellidos,
      telefonos: [cliente.telefono, cliente.contactoReferenciaTelefono],
    };
    const ticketInfo = {
      id: ticket.id,
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
    };
    const empresaInfo = {
      nombre: empresax.nombre,
    };

    // 5) Formatear números y enviar por Twilio
    const numerosValidos = clientInfo.telefonos
      .map((n) => {
        try {
          return this.formatearNumeroWhatsApp(n);
        } catch (error) {
          console.warn(`Número descartado: ${n} -> ${error.message}`);
          return null;
        }
      })
      .filter((v): v is string => !!v);

    for (const numero of numerosValidos) {
      await this.twilio.sendWhatsAppTemplate(numero, TEMPLATE_SID, {
        '1':
          clientInfo.nombres && clientInfo.apellidos
            ? `${clientInfo.nombres} ${clientInfo.apellidos}`
            : 'Sin nombre',
        '2': empresaInfo.nombre ? empresaInfo.nombre : 'Nova Sistemas S.A.',
        '3': ticketInfo.titulo ? ticketInfo.titulo : 'Título no disponible',
        '4': ticketInfo.id ? `${ticketInfo.id}` : 'ID no disponible',
        '5': ticketInfo.descripcion
          ? ticketInfo.descripcion
          : 'Sin descripción',
      });
    }

    console.log('El usuario ha sido notificado.');
  }

  formatearNumeroWhatsApp(numero: string): string {
    // Limpiar caracteres no numéricos
    const limpio = numero.trim().replace(/\D/g, '');

    // Si ya tiene el código completo
    if (limpio.startsWith('502') && limpio.length === 11) {
      return `whatsapp:+${limpio}`;
    }

    // Si es número nacional (8 dígitos)
    if (limpio.length === 8) {
      return `whatsapp:+502${limpio}`;
    }

    // Si ya viene con prefijo internacional completo (ej: +502)
    if (numero.startsWith('+')) {
      return `whatsapp:${numero}`;
    }

    // Número inválido
    throw new Error(`Número no válido o mal formateado: "${numero}"`);
  }
}
