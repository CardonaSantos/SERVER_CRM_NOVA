import { ZonaFacturacionEntity } from '../../domain/entities/zona-facturacion.entity';
import { ZonaFacturacionModificadaError } from '../../domain/errors/zona-facturacion.errors';
import {
  UsoZonaFacturacion,
  ZonaFacturacionRepositoryPort,
} from '../../domain/ports/zona-facturacion-repository.port';
import {
  CrearZonaFacturacionProps,
  ZonaFacturacionProps,
} from '../../domain/props/zona-facturacion.props';

export const DATOS_ZONA: CrearZonaFacturacionProps = {
  empresaId: 1,
  nombre: 'Zona centro',
  diaGeneracionFactura: 1,
  diaPago: 10,
  diaRecordatorio: 5,
  diaSegundoRecordatorio: 8,
  diaCorte: 15,
  suspenderTrasFacturas: 2,
  enviarRecordatorio: true,
  enviarRecordatorioGeneracion: false,
  enviarAvisoPago: false,
  enviarRecordatorio1: true,
  enviarRecordatorio2: false,
};

export class ZonaFacturacionRepositoryFake
  implements ZonaFacturacionRepositoryPort
{
  readonly filas = new Map<number, ZonaFacturacionProps>();
  readonly usos = new Map<number, UsoZonaFacturacion>();
  private siguienteId = 1;

  sembrar(cambios: Partial<ZonaFacturacionProps> = {}): number {
    const id = cambios.id ?? this.siguienteId++;
    this.filas.set(id, {
      ...DATOS_ZONA,
      diaCorte: 15,
      suspenderTrasFacturas: 2,
      creadoEn: new Date('2026-01-01T00:00:00Z'),
      actualizadoEn: new Date('2026-01-01T00:00:00Z'),
      eliminadoEn: null,
      eliminadoPorId: null,
      ...cambios,
      id,
    });
    return id;
  }

  findById(id: number): Promise<ZonaFacturacionEntity | null> {
    const fila = this.filas.get(id);

    return Promise.resolve(
      fila ? ZonaFacturacionEntity.hydrate({ ...fila }) : null,
    );
  }

  create(entity: ZonaFacturacionEntity): Promise<ZonaFacturacionEntity> {
    const id = this.siguienteId++;
    this.filas.set(id, { ...entity.toPrimitives(), id });

    return this.findById(id).then((zona) => zona!);
  }

  update(entity: ZonaFacturacionEntity): Promise<ZonaFacturacionEntity> {
    if (this.filas.get(entity.id!)?.eliminadoEn !== null) {
      return Promise.reject(new ZonaFacturacionModificadaError());
    }
    this.filas.set(entity.id!, entity.toPrimitives());

    return Promise.resolve(entity);
  }

  contarUso(id: number): Promise<UsoZonaFacturacion> {
    return Promise.resolve(this.usos.get(id) ?? { clientes: 0, facturas: 0 });
  }

  eliminar(entity: ZonaFacturacionEntity): Promise<void> {
    if (this.filas.get(entity.id!)?.eliminadoEn !== null) {
      return Promise.reject(new ZonaFacturacionModificadaError());
    }
    this.filas.set(entity.id!, entity.toPrimitives());

    return Promise.resolve();
  }
}
