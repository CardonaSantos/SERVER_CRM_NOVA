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
      const sectores = await this.prisma.sector.findMany();
      return sectores;
    } catch (error) {
      throw new Error('Error al obtener los sectores: ' + error.message);
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
