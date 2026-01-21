import { PrismaService } from 'src/prisma/prisma.service';
import { IpRepository } from '../domain/ip.repository';
import { IP, IpMapper } from '../entities/customer-network-config.entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PrismaIpRepository implements IpRepository {
  private readonly logger = new Logger(PrismaIpRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    // private readonly sshModule: SshMikrotikConnectionService,
  ) {}

  async create(dto: IP): Promise<IP> {
    try {
      const record = IpMapper.toPrisma(dto);

      const newRecord = await this.prisma.iP.create({
        data: {
          direccionIp: record.direccionIp,
          gateway: record.gateway,
          mascara: record.mascara,
          cliente: {
            connect: {
              id: record.clienteId,
            },
          },
        },
      });
      return IpMapper.toDomain(newRecord);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaIpRepository.create');
    }
  }

  async delete(id: number): Promise<IP | null> {
    try {
      const updateRecord = await this.prisma.iP.delete({
        where: {
          id,
        },
      });
      return IpMapper.toDomain(updateRecord);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaIpRepository.delete');
    }
  }

  async update(dto: Partial<IP>): Promise<IP> {
    try {
      this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);
      const updateRecord = await this.prisma.iP.update({
        where: {
          id: dto.getId(),
        },
        data: {
          direccionIp: dto.getDireccionIp(),
          gateway: dto.getGateway(),
          mascara: dto.getMascara(),
          cliente: {
            connect: {
              id: dto.getClienteId(),
            },
          },
        },
      });

      return IpMapper.toDomain(updateRecord);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaIpRepository.update');
    }
  }
}
