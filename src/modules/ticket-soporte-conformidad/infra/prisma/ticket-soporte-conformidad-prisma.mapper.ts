import {
  Prisma,
  TicketConformidad as PrismaTicketConformidad,
  TicketConformidadResultado as PrismaResultado,
  TicketFirma as PrismaTicketFirma,
  TicketFirmaOrigen as PrismaFirmaOrigen,
  TicketFirmaTipo as PrismaFirmaTipo,
} from '@prisma/client';
import { TicketConformidadEntity } from '../../domain/entities/ticket-conformidad.entity';
import { TicketFirmaEntity } from '../../domain/entities/ticket-firma.entity';
import { TicketConformidadResultado } from '../../domain/enums/ticket-conformidad-resultado.enum';
import { TicketFirmaOrigen } from '../../domain/enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../../domain/enums/ticket-firma-tipo.enum';

const RESULTADO_A_DOMINIO: Record<PrismaResultado, TicketConformidadResultado> =
  {
    [PrismaResultado.PENDIENTE]: TicketConformidadResultado.PENDIENTE,
    [PrismaResultado.CONFORME]: TicketConformidadResultado.CONFORME,
    [PrismaResultado.REQUIERE_RETRABAJO]:
      TicketConformidadResultado.REQUIERE_RETRABAJO,
  };

const RESULTADO_A_PRISMA: Record<TicketConformidadResultado, PrismaResultado> =
  {
    [TicketConformidadResultado.PENDIENTE]: PrismaResultado.PENDIENTE,
    [TicketConformidadResultado.CONFORME]: PrismaResultado.CONFORME,
    [TicketConformidadResultado.REQUIERE_RETRABAJO]:
      PrismaResultado.REQUIERE_RETRABAJO,
  };

const TIPO_A_DOMINIO: Record<PrismaFirmaTipo, TicketFirmaTipo> = {
  [PrismaFirmaTipo.CLIENTE]: TicketFirmaTipo.CLIENTE,
  [PrismaFirmaTipo.TECNICO]: TicketFirmaTipo.TECNICO,
};

const TIPO_A_PRISMA: Record<TicketFirmaTipo, PrismaFirmaTipo> = {
  [TicketFirmaTipo.CLIENTE]: PrismaFirmaTipo.CLIENTE,
  [TicketFirmaTipo.TECNICO]: PrismaFirmaTipo.TECNICO,
};

const ORIGEN_A_DOMINIO: Record<PrismaFirmaOrigen, TicketFirmaOrigen> = {
  [PrismaFirmaOrigen.CRM]: TicketFirmaOrigen.CRM,
  [PrismaFirmaOrigen.PUBLICO]: TicketFirmaOrigen.PUBLICO,
};

const ORIGEN_A_PRISMA: Record<TicketFirmaOrigen, PrismaFirmaOrigen> = {
  [TicketFirmaOrigen.CRM]: PrismaFirmaOrigen.CRM,
  [TicketFirmaOrigen.PUBLICO]: PrismaFirmaOrigen.PUBLICO,
};

/** Único lugar donde se convierten enums y fechas entre Prisma y el dominio. */
export class TicketSoporteConformidadPrismaMapper {
  static resultadoADominio(valor: PrismaResultado): TicketConformidadResultado {
    return RESULTADO_A_DOMINIO[valor];
  }

  static tipoFirmaADominio(valor: PrismaFirmaTipo): TicketFirmaTipo {
    return TIPO_A_DOMINIO[valor];
  }

  static tipoFirmaAPrisma(valor: TicketFirmaTipo): PrismaFirmaTipo {
    return TIPO_A_PRISMA[valor];
  }

  static origenFirmaADominio(valor: PrismaFirmaOrigen): TicketFirmaOrigen {
    return ORIGEN_A_DOMINIO[valor];
  }

  static conformidadToDomain(
    registro: PrismaTicketConformidad,
  ): TicketConformidadEntity {
    return TicketConformidadEntity.hydrate({
      id: registro.id,
      ticketId: registro.ticketId,
      clienteId: registro.clienteId,
      tecnicoAsignadoId: registro.tecnicoAsignadoId,
      creadoPorId: registro.creadoPorId,
      resultado: RESULTADO_A_DOMINIO[registro.resultado],
      creadoEn: registro.creadoEn,
      actualizadoEn: registro.actualizadoEn,
      respondidoEn: registro.respondidoEn,
    });
  }

  static conformidadToCreatePersistence(
    entidad: TicketConformidadEntity,
  ): Prisma.TicketConformidadUncheckedCreateInput {
    const props = entidad.toPrimitives();

    return {
      ticketId: props.ticketId,
      clienteId: props.clienteId,
      tecnicoAsignadoId: props.tecnicoAsignadoId,
      creadoPorId: props.creadoPorId,
      resultado: RESULTADO_A_PRISMA[props.resultado],
      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
      respondidoEn: props.respondidoEn,
    };
  }

  static firmaToDomain(registro: PrismaTicketFirma): TicketFirmaEntity {
    return TicketFirmaEntity.hydrate({
      id: registro.id,
      conformidadId: registro.conformidadId,
      mediaId: registro.mediaId,
      tipo: TIPO_A_DOMINIO[registro.tipo],
      usuarioFirmanteId: registro.usuarioFirmanteId,
      nombreFirmante: registro.nombreFirmante,
      telefonoFirmante: registro.telefonoFirmante,
      origen: ORIGEN_A_DOMINIO[registro.origen],
      ipOrigen: registro.ipOrigen,
      userAgent: registro.userAgent,
      firmadoEn: registro.firmadoEn,
    });
  }

  static firmaToCreatePersistence(
    entidad: TicketFirmaEntity,
  ): Prisma.TicketFirmaUncheckedCreateInput {
    const props = entidad.toPrimitives();

    return {
      conformidadId: props.conformidadId,
      mediaId: props.mediaId,
      tipo: TIPO_A_PRISMA[props.tipo],
      usuarioFirmanteId: props.usuarioFirmanteId,
      nombreFirmante: props.nombreFirmante,
      telefonoFirmante: props.telefonoFirmante,
      origen: ORIGEN_A_PRISMA[props.origen],
      ipOrigen: props.ipOrigen,
      userAgent: props.userAgent,
      firmadoEn: props.firmadoEn,
    };
  }
}
