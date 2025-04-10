import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SectorService {
  // Crear un nuevo sector
  constructor(private readonly prisma: PrismaService) {}
  async create(createSectorDto: CreateSectorDto) {
    try {
      console.log('La data es: ', createSectorDto);

      const newSector = await this.prisma.sector.create({
        data: {
          nombre: createSectorDto.nombre,
          descripcion: createSectorDto.descripcion,
          municipioId: createSectorDto.municipioId,
        },
      });
      return newSector;
    } catch (error) {
      throw new Error('Error al crear el sector: ' + error.message);
    }
  }

  // Editar un sector existente
  async update(id: number, updateSectorDto: UpdateSectorDto) {
    try {
      const sector = await this.prisma.sector.findUnique({
        where: { id },
      });

      if (!sector) {
        throw new NotFoundException('Sector no encontrado');
      }

      const updatedSector = await this.prisma.sector.update({
        where: { id },
        data: updateSectorDto,
      });

      return updatedSector;
    } catch (error) {
      throw new Error('Error al actualizar el sector: ' + error.message);
    }
  }

  async updateSector(sectorId: number, updateSectorDto: UpdateSectorDto) {
    try {
      console.log('actualizando sector con id: ', sectorId);
      console.log('datos a actualizar: ', updateSectorDto);
      // Verificar si el sector existe

      const sector = await this.prisma.sector.findUnique({
        where: { id: sectorId },
      });

      if (!sector) {
        throw new NotFoundException('Sector no encontrado');
      }

      const updatedSector = await this.prisma.sector.update({
        where: { id: sectorId },
        data: updateSectorDto,
      });

      return updatedSector;
    } catch (error) {
      throw new Error('Error al actualizar el sector: ' + error.message);
    }
  }

  // Eliminar un sector
  async delete(id: number) {
    try {
      const sector = await this.prisma.sector.findUnique({
        where: { id },
      });

      if (!sector) {
        throw new NotFoundException('Sector no encontrado');
      }

      await this.prisma.sector.delete({
        where: { id },
      });

      return { message: 'Sector eliminado correctamente' };
    } catch (error) {
      throw new Error('Error al eliminar el sector: ' + error.message);
    }
  }

  // Obtener todos los sectores
  async findAll() {
    try {
      const sectores = await this.prisma.sector.findMany({
        include: {
          clientes: {
            select: {
              id: true,
              nombre: true,
              telefono: true,
              direccion: true,
            },
          },
          municipio: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      const sectoresFormat = sectores.map((sec) => ({
        id: sec.id,
        nombre: sec.nombre,
        descripcion: sec.descripcion,
        municipioId: sec.municipioId,
        creadoEn: sec.creadoEn,
        actualizadoEn: sec.actualizadoEn,
        municipio: {
          nombre: sec.municipio.nombre,
          id: sec.municipio.id,
        },
        clientes: sec.clientes.map((cli) => ({
          id: cli.id,
          nombre: cli.nombre,
          telefono: cli.telefono,
          direccion: cli.direccion,
        })),
      }));

      return sectoresFormat;
    } catch (error) {
      throw new Error('Error al obtener los sectores: ' + error.message);
    }
  }

  async findAllSectoresToSelect() {
    try {
      const sectors = await this.prisma.sector.findMany({
        select: {
          id: true,
          nombre: true,
          _count: {
            select: {
              clientes: true, // Esto cuenta el número de clientes relacionados con cada sector
            },
          },
        },
      });

      return sectors.map((sector) => ({
        id: sector.id,
        nombre: sector.nombre,
        clientesCount: sector._count.clientes, // Número de clientes por sector
      }));
    } catch (error) {
      console.log(error);
      throw new Error('Error al obtener los sectores');
    }
  }

  async getSectoresToEdit() {
    try {
      const sectors = await this.prisma.municipio.findMany({
        select: {
          id: true,
          nombre: true,
        },
      });
      return sectors;
    } catch (error) {
      console.log(error);
    }
  }

  //servicio consumible para la creacion de un cliente y asignarle el sector

  async linkClientToSector(clienteId: number, sectorId: number) {
    try {
      const newCustomerLinked = await this.prisma.clienteInternet.update({
        where: {
          id: clienteId,
        },
        data: {
          sector: {
            connect: {
              id: sectorId,
            },
          },
        },
      });

      // Retornar el cliente ya vinculado al sector

      console.log('el cliente vinculado es: ', newCustomerLinked);

      return;
    } catch (error) {
      console.log(error);
      throw new Error('Error al vincular cliente al sector');
    }
  }
}
