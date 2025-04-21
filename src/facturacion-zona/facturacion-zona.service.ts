import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateFacturacionZonaDto } from './dto/create-facturacion-zona.dto';
import { UpdateFacturacionZonaDto } from './dto/update-facturacion-zona.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FacturacionZonaService {
  constructor(private readonly prisma: PrismaService) {}

  //Crear una facturacion zona
  async create(createFacturacionZonaDto: CreateFacturacionZonaDto) {
    return await this.prisma.$transaction(async (tx) => {
      console.log('La data llegando es: ', createFacturacionZonaDto);

      const newFacturacionZona = await tx.facturacionZona.create({
        data: {
          nombre: createFacturacionZonaDto.nombre,
          empresaId: createFacturacionZonaDto.empresaId,

          // Fechas clave
          diaGeneracionFactura: createFacturacionZonaDto.diaGeneracionFactura,
          diaPago: createFacturacionZonaDto.diaPago,
          diaRecordatorio: createFacturacionZonaDto.diaRecordatorio,
          diaSegundoRecordatorio:
            createFacturacionZonaDto.diaSegundoRecordatorio,
          horaRecordatorio: createFacturacionZonaDto.horaRecordatorio,
          diaCorte: createFacturacionZonaDto.diaCorte,
          suspenderTrasFacturas: createFacturacionZonaDto.suspenderTrasFacturas,

          // Flags de envío de recordatorios
          enviarRecordatorioGeneracion:
            createFacturacionZonaDto.enviarRecordatorioGeneracion,
          enviarAvisoPago: createFacturacionZonaDto.enviarAvisoPago,
          enviarRecordatorio1: createFacturacionZonaDto.enviarRecordatorio1,
          enviarRecordatorio2: createFacturacionZonaDto.enviarRecordatorio2,
          enviarRecordatorio: createFacturacionZonaDto.enviarRecordatorio,

          // Canales de notificación
          whatsapp: createFacturacionZonaDto.whatsapp,
          email: createFacturacionZonaDto.email,
          llamada: createFacturacionZonaDto.llamada,
          sms: createFacturacionZonaDto.sms,
          telegram: createFacturacionZonaDto.telegram,
        },
      });

      if (!newFacturacionZona) {
        throw new InternalServerErrorException(
          'Error al generar zona de facturación',
        );
      }

      console.log(newFacturacionZona);
      return newFacturacionZona;
    });
  }

  async findAll() {
    try {
      const zonas = await this.prisma.facturacionZona.findMany({
        select: {
          id: true,
          nombre: true,
          empresaId: true,

          // Generación de factura
          diaGeneracionFactura: true,
          enviarRecordatorioGeneracion: true,

          // Aviso de pago
          diaPago: true,
          enviarAvisoPago: true,

          // Recordatorios
          diaRecordatorio: true,
          enviarRecordatorio1: true,
          diaSegundoRecordatorio: true,
          enviarRecordatorio2: true,
          horaRecordatorio: true,
          enviarRecordatorio: true,

          // Corte y suspensión
          diaCorte: true,
          suspenderTrasFacturas: true,

          // Timestamps
          creadoEn: true,
          actualizadoEn: true,

          // Medios de notificación
          whatsapp: true,
          email: true,
          llamada: true,
          sms: true, // solo si realmente usás sms, si no, lo podés quitar

          // Relaciones (aunque no se usan aquí directamente)
          clientes: false,
          facturas: false,
        },
      });

      const result = await Promise.all(
        zonas.map(async (zona) => {
          const [clientesCount, facturasCount] = await Promise.all([
            this.prisma.clienteInternet.count({
              where: { facturacionZonaId: zona.id },
            }),
            this.prisma.facturaInternet.count({
              where: { facturacionZonaId: zona.id },
            }),
          ]);

          return {
            ...zona,
            clientesCount,
            facturasCount,
          };
        }),
      );

      return result;
    } catch (error) {
      console.error('Error al obtener las zonas de facturación:', error);
      throw new Error('Error al obtener las zonas de facturación');
    }
  }

  async findAllFacturacionZona() {
    try {
      const zonas = await this.prisma.facturacionZona.findMany({
        select: {
          id: true,
          nombre: true,
        },
      });

      const result = await Promise.all(
        zonas.map(async (zona) => {
          const clientesCount = await this.prisma.clienteInternet.count({
            where: {
              facturacionZonaId: zona.id, // Filtramos los clientes por la zona
            },
          });

          const facturasCount = await this.prisma.facturaInternet.count({
            where: {
              facturacionZonaId: zona.id, // Filtramos las facturas por la zona
            },
          });

          return {
            id: zona.id,
            nombre: zona.nombre,

            clientesCount, // Añadimos el conteo de clientes
            facturasCount, // Añadimos el conteo de facturas
          };
        }),
      );

      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async findZonasFacturacionToRuta() {
    try {
      const zonasFacturacion = await this.prisma.facturacionZona.findMany({
        select: {
          id: true,
          creadoEn: true,
          actualizadoEn: true,
          nombre: true,
          diaPago: true,
          diaGeneracionFactura: true,
          diaCorte: true,
          _count: {
            select: {
              facturas: true,
              clientes: true,
            },
          },
        },
      });

      const facturacionZonatoRuta = zonasFacturacion.map((f) => ({
        id: f.id,
        creadoEn: f.creadoEn,
        actualizadoEn: f.actualizadoEn,
        nombreRuta: f.nombre,
        diaPago: f.diaPago,
        diaGeneracionFactura: f.diaGeneracionFactura,
        diaCorte: f.diaCorte,
        facturas: f._count.facturas,
        clientes: f._count.clientes,
      }));
      return facturacionZonatoRuta;
    } catch (error) {
      console.log(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} facturacionZona`;
  }

  async update(updateFacturacionZonaDto: UpdateFacturacionZonaDto) {
    return await this.prisma.$transaction(async (tx) => {
      console.log('La data actualizando es: ', updateFacturacionZonaDto);

      const updatedFacturacionZona = await tx.facturacionZona.update({
        where: { id: updateFacturacionZonaDto.id },
        data: {
          nombre: updateFacturacionZonaDto.nombre,
          // empresaId: updateFacturacionZonaDto.empresaId, // Si no se modifica, mejor no incluir

          // Fechas clave
          diaGeneracionFactura: updateFacturacionZonaDto.diaGeneracionFactura,
          diaPago: updateFacturacionZonaDto.diaPago,
          diaRecordatorio: updateFacturacionZonaDto.diaRecordatorio,
          diaSegundoRecordatorio:
            updateFacturacionZonaDto.diaSegundoRecordatorio,
          horaRecordatorio: updateFacturacionZonaDto.horaRecordatorio,
          diaCorte: updateFacturacionZonaDto.diaCorte,
          suspenderTrasFacturas: updateFacturacionZonaDto.suspenderTrasFacturas,

          // Flags de recordatorios
          enviarRecordatorioGeneracion:
            updateFacturacionZonaDto.enviarRecordatorioGeneracion,
          enviarAvisoPago: updateFacturacionZonaDto.enviarAvisoPago,
          enviarRecordatorio1: updateFacturacionZonaDto.enviarRecordatorio1,
          enviarRecordatorio2: updateFacturacionZonaDto.enviarRecordatorio2,
          enviarRecordatorio: updateFacturacionZonaDto.enviarRecordatorio,

          // Medios de notificación
          whatsapp: updateFacturacionZonaDto.whatsapp,
          email: updateFacturacionZonaDto.email,
          llamada: updateFacturacionZonaDto.llamada,
          sms: updateFacturacionZonaDto.sms,
          telegram: updateFacturacionZonaDto.telegram,
        },
      });

      if (!updatedFacturacionZona) {
        throw new InternalServerErrorException(
          'Error al actualizar zona de facturación',
        );
      }

      console.log(updatedFacturacionZona);
      return updatedFacturacionZona;
    });
  }

  // remove(id: number) {}

  async remove(zonaFacturacionId: number) {
    console.log('entrando a eliminar: ', zonaFacturacionId);

    return await this.prisma.$transaction(async (tx) => {
      // Verificamos si existe el cliente
      const facturacionZona = await tx.facturacionZona.findUnique({
        where: { id: zonaFacturacionId },
      });

      if (!facturacionZona) {
        throw new NotFoundException('No se encontró el registro');
      }

      const x = await tx.facturacionZona.delete({
        where: {
          id: zonaFacturacionId,
        },
      });

      console.log('La zona de facturacion es: ', x);

      return x;
    });
  }
}
