import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTicketResumenDto } from '../dto/create-ticket-resuman.dto';
import { UpdateTicketResumanDto } from '../dto/update-ticket-resuman.dto';
import { TicketResumen } from '../entities/ticket-resuman.entity';
import {
  TICKET_RESUMEN_REPOSITORY,
  TicketResumenRepository,
} from '../domain/ticket-resumen.repository';

@Injectable()
export class TicketResumenService {
  private readonly logger = new Logger(TicketResumenService.name);

  constructor(
    @Inject(TICKET_RESUMEN_REPOSITORY)
    private readonly repo: TicketResumenRepository,
  ) {}

  // CREATE
  async create(dto: CreateTicketResumenDto) {
    const resumen = TicketResumen.create({
      ticketId: dto.ticketId,
      solucionId: dto.solucionId ?? null,
      resueltoComo: dto.resueltoComo ?? null,
      notasInternas: dto.notasInternas ?? null,
      reabierto: dto.reabierto,
      numeroReaperturas: dto.numeroReaperturas,
      intentos: dto.intentos,
      // tiempoTotalMinutos: dto.tiempoTotalMinutos,
      // tiempoTecnicoMinutos: dto.tiempoTecnicoMinutos,
    });


    const created = await this.repo.create(resumen);

    this.logger.debug('TicketResumen creado: ', created);

    return created.toObject();
  }

  // READ ALL
  async findAll() {
    const items = await this.repo.getAll();
    // Puedes devolver `items` directo o mapearlos a DTO de salida
    return items.map((r) => r.toObject());
  }

  // READ ONE
  async findOne(id: number) {
    const resumen = await this.repo.findById(id);
    if (!resumen) {
      throw new NotFoundException(`TicketResumen con id ${id} no encontrado`);
    }
    return resumen.toObject();
  }

  // UPDATE
  async update(id: number, dto: UpdateTicketResumanDto) {
    const resumen = await this.repo.findById(id);
    if (!resumen) {
      throw new NotFoundException(`TicketResumen con id ${id} no encontrado`);
    }

    // Lo tratamos como PATCH: solo tocamos lo que venga definido
    if (dto.resueltoComo !== undefined || dto.solucionId !== undefined) {
      resumen.setSolucion(
        dto.solucionId ?? resumen.solucionId,
        dto.resueltoComo ?? resumen.resueltoComo,
      );
    }

    if (dto.notasInternas !== undefined) {
      resumen.setNotasInternas(dto.notasInternas);
    }

    if (
      dto.tiempoTotalMinutos !== undefined ||
      dto.tiempoTecnicoMinutos !== undefined
    ) {
      resumen.setTiempos({
        tiempoTotalMinutos:
          dto.tiempoTotalMinutos ?? resumen.tiempoTotalMinutos,
        tiempoTecnicoMinutos:
          dto.tiempoTecnicoMinutos ?? resumen.tiempoTecnicoMinutos,
      });
    }

    if (dto.reabierto !== undefined) {
      if (dto.reabierto) {
        resumen.marcarReabierto();
      } else {
        resumen.marcarCerradoDefinitivo();
      }
    }

    // si en tu Update DTO manejas explícitamente numeroReaperturas o intentos,
    // lo ideal sería añadir métodos adicionales a la entidad (p.ej. setIntentos)
    // y usarlos aquí. Por ahora lo dejamos gestionado por métodos de dominio
    // específicos (reabierto / registrarIntento) en otros casos de uso.

    const updated = await this.repo.update(resumen);

    return updated.toObject();
  }

  // DELETE
  async remove(id: number) {
    const deleted = await this.repo.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`TicketResumen con id ${id} no encontrado`);
    }

    return {
      message: 'TicketResumen eliminado correctamente',
      ticketResumen: deleted.toObject(),
    };
  }
}
