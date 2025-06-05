import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwilioService } from 'src/twilio/twilio.service';

@Injectable()
export class GenerarMensajeSoporteService {
  constructor(
    private readonly twilio: TwilioService,
    private readonly prisma: PrismaService,
  ) {}

  async GenerarMensajeTicketSoporte(clienteId: number, ticketId: number) {
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

    console.log('El cliente encontrado es: ', cliente);

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
    console.log('El ticket encontrado es: ', ticket);

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
    console.log('El empresax encontrado es: ', empresax);

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

    console.log('los usuarios son: ', numerosValidos);

    for (const numero of numerosValidos) {
      await this.twilio.sendWhatsAppTemplate(
        numero,
        'HXa378866e77e2a975cc526248d8a7bea7',
        {
          '1': `${clientInfo.nombres} ${clientInfo.apellidos}`,
          '2': `${empresaInfo.nombre}`,
          '3': `${ticketInfo.titulo}`,
          '4': `${ticketInfo.id}`,
          '5': `${ticketInfo.descripcion}`,
        },
      );
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
