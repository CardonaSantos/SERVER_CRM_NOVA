import {
  ClienteInternet,
  EstadoCliente,
  EstadoCobranzaCliente as EstadoCobranzaPrisma,
  Prisma,
} from '@prisma/client';
import { ClienteEntity } from '../../domain/entities/cliente.entity';
import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-cliente.enum';
import { EstadoClientePersistido } from '../../domain/enums/estado-operativo-cliente.enum';
import { ClienteProps } from '../../domain/props/cliente.props';

export class ClientePrismaMapper {
  static toDomain(record: ClienteInternet): ClienteEntity {
    return ClienteEntity.hydrate({
      id: record.id,
      empresaId: record.empresaId,
      asesorId: record.asesorId,
      nombre: record.nombre,
      apellidos: record.apellidos,
      dpi: record.dpi,
      observaciones: record.observaciones,
      nota: record.nota,
      telefono: record.telefono,
      direccion: record.direccion,
      contactoReferenciaNombre: record.contactoReferenciaNombre,
      contactoReferenciaTelefono: record.contactoReferenciaTelefono,
      contrasenaWifi: record.contrasenaWifi,
      ssidRouter: record.ssidRouter,
      fechaInstalacion: record.fechaInstalacion,
      servicioInternetId: record.servicioInternetId,
      sectorId: record.sectorId,
      enviarRecordatorio: record.enviarRecordatorio,
      isEliminado: record.isEliminado,
      eliminadoEn: record.eliminadoEn,
      estadoCliente: record.estadoCliente as string as EstadoClientePersistido,
      estadoCobranza: record.estadoCobranza as string as EstadoCobranzaCliente,
      municipioId: record.municipioId,
      departamentoId: record.departamentoId,
      facturacionZonaId: record.facturacionZonaId,
      mikrotikRouterId: record.mikrotikRouterId,
      searchNombre: record.searchNombre,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      desinstaladoEn: record.desinstaladoEn,
      eliminadoPorId: record.eliminadoPorId,
      motivoEliminacion: record.motivoEliminacion,
      comentarioEliminacion: record.comentarioEliminacion,
    });
  }

  /** Solo los campos presentes en `cambios`; `actualizadoEn` lo pone Prisma. */
  static toUpdatePersistence(
    cambios: Partial<ClienteProps>,
  ): Prisma.ClienteInternetUncheckedUpdateManyInput {
    const { estadoCliente, estadoCobranza, ...resto } = cambios;
    delete resto.id;
    delete resto.creadoEn;
    delete resto.actualizadoEn;

    return {
      ...resto,
      estadoCliente: estadoCliente as string as EstadoCliente | undefined,
      estadoCobranza: estadoCobranza as string as
        | EstadoCobranzaPrisma
        | undefined,
    };
  }
}
