import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
          diaGeneracionFactura: createFacturacionZonaDto.diaGeneracionFactura, // Día del mes cuando se genera la factura
          diaPago: createFacturacionZonaDto.diaPago, // Día del mes cuando se espera el pago
          diaRecordatorio: createFacturacionZonaDto.diaRecordatorio, // Día del mes cuando se enviará el recordatorio
          horaRecordatorio: createFacturacionZonaDto.horaRecordatorio,
          // BOLEANOS DE RECORDATORIOS
          whatsapp: createFacturacionZonaDto.whatsapp,
          email: createFacturacionZonaDto.email,
          llamada: createFacturacionZonaDto.llamada,
          sms: createFacturacionZonaDto.sms,
          telegram: createFacturacionZonaDto.telegram,
          diaCorte: createFacturacionZonaDto.diaCorte,
          suspenderTrasFacturas: createFacturacionZonaDto.suspenderTrasFacturas,
          diaSegundoRecordatorio:
            createFacturacionZonaDto.diaSegundoRecordatorio,
        },
      });

      if (!newFacturacionZona) {
        throw new InternalServerErrorException(
          'Error al generar zona de facturacion',
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
          diaGeneracionFactura: true,
          diaPago: true,
          diaRecordatorio: true,
          horaRecordatorio: true,
          enviarRecordatorio: true,
          // mediosNotificacion: true,
          diaCorte: true,
          suspenderTrasFacturas: true,
          creadoEn: true,
          actualizadoEn: true,
          // Relacionado con el conteo de clientes y facturas
          clientes: true,
          facturas: true,
          email: true,
          llamada: true,
          sms: true,
          whatsapp: true,
          diaSegundoRecordatorio: true,
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
            empresaId: zona.empresaId,
            diaGeneracionFactura: zona.diaGeneracionFactura,
            diaPago: zona.diaPago,
            diaRecordatorio: zona.diaRecordatorio,
            horaRecordatorio: zona.horaRecordatorio,
            enviarRecordatorio: zona.enviarRecordatorio,
            // mediosNotificacion: zona.mediosNotificacion,
            diaCorte: zona.diaCorte,
            suspenderTrasFacturas: zona.suspenderTrasFacturas,
            creadoEn: zona.creadoEn,
            actualizadoEn: zona.actualizadoEn,
            whatsapp: zona.whatsapp,
            email: zona.email,
            llamada: zona.llamada,
            diaSegundoRecordatorio: zona.diaSegundoRecordatorio,

            clientesCount, // Añadimos el conteo de clientes
            facturasCount, // Añadimos el conteo de facturas
          };
        }),
      );

      return result;
    } catch (error) {
      // Manejo de errores
      console.error('Error al obtener las zonas de facturación', error);
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
          empresaId: updateFacturacionZonaDto.empresaId,
          diaGeneracionFactura: updateFacturacionZonaDto.diaGeneracionFactura,
          diaPago: updateFacturacionZonaDto.diaPago,
          diaRecordatorio: updateFacturacionZonaDto.diaRecordatorio,
          diaSegundoRecordatorio:
            updateFacturacionZonaDto.diaSegundoRecordatorio,
          horaRecordatorio: updateFacturacionZonaDto.horaRecordatorio,
          enviarRecordatorio: updateFacturacionZonaDto.enviarRecordatorio,
          // BOLEANOS DE RECORDATORIOS
          whatsapp: updateFacturacionZonaDto.whatsapp,
          email: updateFacturacionZonaDto.email,
          llamada: updateFacturacionZonaDto.llamada,
          sms: updateFacturacionZonaDto.sms,
          telegram: updateFacturacionZonaDto.telegram,
          diaCorte: updateFacturacionZonaDto.diaCorte,
          suspenderTrasFacturas: updateFacturacionZonaDto.suspenderTrasFacturas,
        },
      });

      if (!updatedFacturacionZona) {
        throw new InternalServerErrorException(
          'Error al actualizar zona de facturacion',
        );
      }
      console.log(updatedFacturacionZona);

      return updatedFacturacionZona;
    });
  }

  remove(id: number) {
    return `This action removes a #${id} facturacionZona`;
  }
}
