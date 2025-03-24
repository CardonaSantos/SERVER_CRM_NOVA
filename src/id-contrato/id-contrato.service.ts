import { Injectable } from '@nestjs/common';
import { CreateIdContratoDto } from './dto/create-id-contrato.dto';
import { UpdateIdContratoDto } from './dto/update-id-contrato.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class IdContratoService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createIdContratoDto: CreateIdContratoDto) {
    return await this.prisma.$transaction(async (tx) => {
      const contradoID = await tx.contratoFisico.create({
        data: {
          idContrato: createIdContratoDto.idContrato,
          archivoContrato: createIdContratoDto.archivoContrato,
          cliente: {
            connect: {
              id: createIdContratoDto.clienteId,
            },
          },
          fechaFirma: createIdContratoDto.fechaFirma,
          observaciones: createIdContratoDto.observaciones,
        },
      });
      return contradoID;
    });
  }

  findAll() {
    return `This action returns all idContrato`;
  }

  findOne(id: number) {
    return `This action returns a #${id} idContrato`;
  }

  update(id: number, updateIdContratoDto: UpdateIdContratoDto) {
    return `This action updates a #${id} idContrato`;
  }

  remove(id: number) {
    return `This action removes a #${id} idContrato`;
  }
}
