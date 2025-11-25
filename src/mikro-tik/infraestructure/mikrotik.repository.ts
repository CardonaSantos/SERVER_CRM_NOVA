import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MikrotikRouterRepository } from '../domain/mikrotik-repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { MikrotikRouter } from '../domain/mikrotik-entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { MikrotikRouter as PrismaMikrotikRouter } from '@prisma/client';
import { CreateMikroTikDto } from '../dto/create-mikro-tik.dto';
import { MikrotikCryptoService } from 'src/ssh-mikrotik-connection/helpers/mikrotik-crypto.service';
import { SelectMikrotik } from './selectMikrotik';

@Injectable()
export class MikrotikRouterPrisma extends MikrotikRouterRepository {
  private readonly logger = new Logger(MikrotikRouterPrisma.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: MikrotikCryptoService,
  ) {
    super();
  }

  async create(mikrotik: MikrotikRouter): Promise<MikrotikRouter> {
    try {
      const data = mikrotik.toObject(); //sacar props
      const encriptedPassword = this.crypto.encrypt(mikrotik.passwordEnc);

      const newRecord = await this.prisma.mikrotikRouter.create({
        data: {
          nombre: data.nombre,
          host: data.host,
          descripcion: data.descripcion,
          sshPort: data.sshPort,
          usuario: data.usuario,
          activo: data.activo,
          passwordEnc: encriptedPassword,
          empresa: {
            connect: { id: data.empresaId },
          },
          ...(data.oltId && {
            olt: {
              connect: { id: data.oltId },
            },
          }),
        },
      });

      return MikrotikRouter.create({
        id: newRecord.id,
        nombre: newRecord.nombre,
        host: newRecord.host,
        sshPort: newRecord.sshPort,
        usuario: newRecord.usuario,
        empresaId: newRecord.empresaId,
        descripcion: newRecord.descripcion ?? undefined,
        activo: newRecord.activo,
        oltId: newRecord.oltId,
        passwordEnc: newRecord.passwordEnc,
        creadoEn: newRecord.creadoEn,
        actualizadoEn: newRecord.actualizadoEn,
      });
    } catch (error) {
      throwFatalError(error, this.logger, 'Mikrotik-repository - create');
    }
  }

  async deleteAll(): Promise<number> {
    try {
      const recordsDeleted = await this.prisma.mikrotikRouter.deleteMany({});
      return recordsDeleted.count;
    } catch (error) {
      throwFatalError(error, this.logger, 'Mikrotik-repository - deleteAll');
    }
  }

  async deleteById(id: number): Promise<MikrotikRouter | null> {
    try {
      const record = await this.prisma.mikrotikRouter.delete({
        where: {
          id: id,
        },
      });

      if (!record) throw new BadRequestException('No encontrado');

      return this.mapPrismaToEntity(record);
    } catch (error) {
      throwFatalError(error, this.logger, 'Mikrotik-repository - deleteAll');
    }
  }

  async findById(id: number): Promise<MikrotikRouter | null> {
    try {
      const record = await this.prisma.mikrotikRouter.findUnique({
        where: { id },
      });

      if (!record) {
        throw new NotFoundException(`Mikrotik con id ${id} no encontrado`);
      }

      return this.mapPrismaToEntity(record);
    } catch (error) {
      throwFatalError(error, this.logger, 'Mikrotik-repository - findById');
    }
  }

  async getAll(): Promise<Array<MikrotikRouter>> {
    try {
      const records = await this.prisma.mikrotikRouter.findMany({
        // select: SelectMikrotik
      });
      const mapped = records.map((rec) => this.mapPrismaToEntity(rec));
      return mapped;
    } catch (error) {
      throwFatalError(error, this.logger, 'Mikrotik-repository - getAll');
    }
  }

  async update(
    id: number,
    dto: CreateMikroTikDto,
  ): Promise<MikrotikRouter | null> {
    try {
      const data: any = { ...dto };

      if (dto.passwordEnc) {
        data.passwordEnc = this.crypto.encrypt(dto.passwordEnc);
      }

      const recordUpdated = await this.prisma.mikrotikRouter.update({
        where: { id },
        data,
      });

      if (!recordUpdated) {
        throw new NotFoundException(`Mikrotik con id ${id} no encontrado`);
      }

      return this.mapPrismaToEntity(recordUpdated);
    } catch (error) {
      throwFatalError(error, this.logger, 'Mikrotik-repository - update');
    }
  }

  private mapPrismaToEntity(record: PrismaMikrotikRouter): MikrotikRouter {
    return MikrotikRouter.create({
      id: record.id,
      nombre: record.nombre,
      host: record.host,
      sshPort: record.sshPort,
      usuario: record.usuario,
      empresaId: record.empresaId,
      descripcion: record.descripcion ?? undefined,
      activo: record.activo,
      oltId: record.oltId,
      passwordEnc: record.passwordEnc,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      // count: record.
    });
  }
}
