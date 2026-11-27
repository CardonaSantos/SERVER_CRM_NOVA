import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import {
  ClienteDeAviso,
  TicketReferenciaQueryPort,
} from '../../domain/ports/ticket-referencia-query.port';

const nombreCompleto = (cliente: {
  nombre: string | null;
  apellidos: string | null;
}) => `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim();

@Injectable()
export class TicketReferenciaPrismaQuery implements TicketReferenciaQueryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** Lee dentro de la unidad de trabajo abierta, si la hay. */
  private get db() {
    return this.transaccional.cliente;
  }

  async clienteVigente(clienteId: number): Promise<ClienteDeAviso | null> {
    const cliente = await this.db.clienteInternet.findFirst({
      where: { id: clienteId, isEliminado: false },
      select: {
        nombre: true,
        apellidos: true,
        telefono: true,
        contactoReferenciaTelefono: true,
      },
    });

    return cliente
      ? {
          nombre: nombreCompleto(cliente),
          telefono: cliente.telefono,
          telefonoReferencia: cliente.contactoReferenciaTelefono,
        }
      : null;
  }

  async usuariosActivos(ids: number[]): Promise<number[]> {
    const usuarios = await this.db.usuario.findMany({
      where: { id: { in: ids }, activo: true },
      select: { id: true },
    });

    return usuarios.map((usuario) => usuario.id);
  }

  async etiquetasVigentes(ids: number[]): Promise<number[]> {
    const etiquetas = await this.db.etiquetaTicket.findMany({
      where: { id: { in: ids }, eliminadoEn: null },
      select: { id: true },
    });

    return etiquetas.map((etiqueta) => etiqueta.id);
  }

  async solucionVigente(id: number): Promise<string | null> {
    const solucion = await this.db.solucionTicket.findFirst({
      where: { id, isEliminado: false },
      select: { solucion: true },
    });

    return solucion?.solucion ?? null;
  }

  async nombresUsuarios(ids: number[]): Promise<Map<number, string>> {
    const usuarios = await this.db.usuario.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true },
    });

    return new Map(usuarios.map((u) => [u.id, u.nombre]));
  }

  async nombresEtiquetas(ids: number[]): Promise<Map<number, string>> {
    const etiquetas = await this.db.etiquetaTicket.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true },
    });

    return new Map(etiquetas.map((e) => [e.id, e.nombre]));
  }

  async nombresClientes(ids: number[]): Promise<Map<number, string>> {
    const clientes = await this.db.clienteInternet.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true, apellidos: true },
    });

    return new Map(clientes.map((c) => [c.id, nombreCompleto(c)]));
  }
}
