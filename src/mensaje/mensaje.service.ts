import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlantillaMensajeDto } from './dto/create-mensaje.dto';
import { UpdatePlantillaMensajeDto } from './dto/update-mensaje.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeletePlantillaMensajeDto } from './dto/delete-mensaje.dto';

export type TipoPlantilla =
  | 'GENERACION_FACTURA'
  | 'RECORDATORIO_1'
  | 'RECORDATORIO_2'
  | 'AVISO_PAGO'
  | 'SUSPENSION'
  | 'CORTE';

interface mensajesPlantillas {
  id: number;
  nombre: string;
  tipo: TipoPlantilla;
  body: string;
  empresaId: number;
  creadoEn: string | Date;
  actualizadoEn: string | Date;
}

@Injectable()
export class MensajeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlantillaMensajeDto: CreatePlantillaMensajeDto) {
    const x = await this.prisma.plantillaMensaje.create({
      data: {
        nombre: createPlantillaMensajeDto.nombre,
        tipo: createPlantillaMensajeDto.tipo,
        body: createPlantillaMensajeDto.body,
        empresaId: createPlantillaMensajeDto.empresaId,
      },
    });
    console.log(x);

    return x;
  }

  async getMensajesPantillas() {
    try {
      const plantillas: mensajesPlantillas[] =
        await this.prisma.plantillaMensaje.findMany({
          select: {
            id: true,
            nombre: true,
            tipo: true,
            body: true,
            empresaId: true,
            creadoEn: true,
            actualizadoEn: true,
          },
        });

      return plantillas.map((plantilla) => ({
        ...plantilla,
        creadoEn: plantilla.creadoEn.toString(),
        actualizadoEn: plantilla.actualizadoEn.toString(),
      }));
    } catch (error) {
      console.log(error);
    }
  }

  async update(
    id: number,
    updatePlantillaMensajeDto: UpdatePlantillaMensajeDto,
  ) {
    const plantilla = await this.prisma.plantillaMensaje.findUnique({
      where: { id },
    });

    if (!plantilla) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return await this.prisma.plantillaMensaje.update({
      where: { id },
      data: {
        ...updatePlantillaMensajeDto,
      },
    });
  }

  async delete(deletePlantillaMensajeDto: DeletePlantillaMensajeDto) {
    const plantilla = await this.prisma.plantillaMensaje.findUnique({
      where: { id: deletePlantillaMensajeDto.id },
    });

    if (!plantilla) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return await this.prisma.plantillaMensaje.delete({
      where: { id: deletePlantillaMensajeDto.id },
    });
  }
}
