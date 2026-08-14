import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { TicketConformidadCanal } from '../../domain/enums/ticket-conformidad-canal.enum';

import { GenerarEnlaceTicketConformidadUseCase } from '../use-cases/generar-enlace-ticket-conformidad.use-case';
import { ObtenerTicketConformidadPublicaUseCase } from '../use-cases/obtener-ticket-conformidad-publica.use-case';
import { RequerirRetrabajoTicketConformidadUseCase } from '../use-cases/requerir-retrabajo-ticket-conformidad.use-case';
import { RegistrarFirmaClienteTicketConformidadUseCase } from '../use-cases/registrar-firma-cliente-ticket-conformidad.use-case';
import {
  TICKET_CONFORMIDAD_QUERY_PORT,
  TicketConformidadQueryPort,
} from '../port/ticket-conformidad-query.port';
import { CrearTicketConformidadUseCase } from '../use-cases/crear-conformidad.use-case';
import { RegistrarFirmaTecnicoTicketConformidadUseCase } from '../use-cases/registrar-firma-tecnico.use-case';

export interface CrearTicketConformidadCommand {
  ticketId: number;

  creadoPorId: number;
}

export interface GenerarEnlaceTicketConformidadCommand {
  conformidadId: number;

  canal: TicketConformidadCanal;

  telefonoDestino?: string | null;

  creadoPorId: number;
}

export interface RegistrarFirmaClienteCommand {
  token: string;

  nombreFirmante: string;

  telefonoFirmante: string;

  firma: {
    bytes: Buffer;

    mimeType: string;

    nombreArchivo: string;
  };

  ipOrigen?: string | null;

  userAgent?: string | null;
}

export interface RegistrarFirmaTecnicoCommand {
  conformidadId: number;

  usuarioFirmanteId: number;

  nombreFirmante: string;

  firma: {
    bytes: Buffer;

    mimeType: string;

    nombreArchivo: string;
  };

  ipOrigen?: string | null;

  userAgent?: string | null;
}

@Injectable()
export class TicketConformidadApplicationService {
  constructor(
    private readonly crearConformidadUseCase: CrearTicketConformidadUseCase,

    private readonly generarEnlaceUseCase: GenerarEnlaceTicketConformidadUseCase,

    private readonly obtenerPublicaUseCase: ObtenerTicketConformidadPublicaUseCase,

    private readonly requerirRetrabajoUseCase: RequerirRetrabajoTicketConformidadUseCase,

    private readonly registrarFirmaClienteUseCase: RegistrarFirmaClienteTicketConformidadUseCase,

    private readonly registrarFirmaTecnicoUseCase: RegistrarFirmaTecnicoTicketConformidadUseCase,

    @Inject(TICKET_CONFORMIDAD_QUERY_PORT)
    private readonly queryPort: TicketConformidadQueryPort,
  ) {}

  /* =======================================================
   * CRM
   * ===================================================== */

  async crear(command: CrearTicketConformidadCommand) {
    return this.crearConformidadUseCase.execute({
      ticketId: command.ticketId,

      creadoPorId: command.creadoPorId,
    });
  }

  async generarEnlace(command: GenerarEnlaceTicketConformidadCommand) {
    return this.generarEnlaceUseCase.execute({
      conformidadId: command.conformidadId,

      canal: command.canal,

      telefonoDestino: command.telefonoDestino ?? null,

      creadoPorId: command.creadoPorId,
    });
  }

  async obtenerDetalle(conformidadId: number) {
    const result = await this.queryPort.findDetalleById(conformidadId);

    if (!result) {
      throw new NotFoundException(`No existe la conformidad ${conformidadId}.`);
    }

    return result;
  }

  async obtenerActualPorTicket(ticketId: number) {
    const result = await this.queryPort.findLatestDetalleByTicketId(ticketId);

    // if (!result) {
    //   throw new NotFoundException(
    //     `El ticket ${ticketId} no posee solicitudes de conformidad.`,
    //   );
    // }

    return result;
  }

  async obtenerHistorialPorTicket(ticketId: number) {
    const result = await this.queryPort.findHistorialByTicketId(ticketId);

    if (!result) {
      throw new NotFoundException(`No existe el ticket ${ticketId}.`);
    }

    return result;
  }

  /* =======================================================
   * PÚBLICO
   * ===================================================== */

  async obtenerPublica(token: string) {
    return this.obtenerPublicaUseCase.execute({
      token,
    });
  }

  async requerirRetrabajo(token: string) {
    return this.requerirRetrabajoUseCase.execute({
      token,
    });
  }

  async registrarFirmaCliente(command: RegistrarFirmaClienteCommand) {
    return this.registrarFirmaClienteUseCase.execute({
      token: command.token,

      nombreFirmante: command.nombreFirmante,

      telefonoFirmante: command.telefonoFirmante,

      firma: command.firma,

      ipOrigen: command.ipOrigen ?? null,

      userAgent: command.userAgent ?? null,
    });
  }

  async registrarFirmaTecnico(command: RegistrarFirmaTecnicoCommand) {
    return this.registrarFirmaTecnicoUseCase.execute({
      conformidadId: command.conformidadId,

      usuarioFirmanteId: command.usuarioFirmanteId,

      nombreFirmante: command.nombreFirmante,

      firma: command.firma,

      ipOrigen: command.ipOrigen ?? null,

      userAgent: command.userAgent ?? null,
    });
  }
}
