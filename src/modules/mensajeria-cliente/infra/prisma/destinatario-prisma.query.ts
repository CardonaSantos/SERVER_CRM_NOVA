import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteDestinatario } from '../../domain/policies/destinatarios.policy';
import { DestinatarioQueryPort } from '../../domain/ports/destinatario-query.port';

@Injectable()
export class DestinatarioPrismaQuery implements DestinatarioQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByIds(clienteIds: number[]): Promise<ClienteDestinatario[]> {
    const records = await this.prisma.clienteInternet.findMany({
      where: { id: { in: clienteIds } },
      select: {
        id: true,
        telefono: true,
        isEliminado: true,
        whatsappActivo: true,
      },
    });

    return records.map((r) => ({
      id: r.id,
      telefono: r.telefono,
      eliminado: r.isEliminado,
      whatsappActivo: r.whatsappActivo,
    }));
  }
}
