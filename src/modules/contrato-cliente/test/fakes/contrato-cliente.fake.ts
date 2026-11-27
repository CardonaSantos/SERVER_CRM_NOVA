import { ContratoClienteEntity } from '../../domain/entities/contrato-cliente.entity';
import { PlantillaContratoEntity } from '../../domain/entities/plantilla-contrato.entity';
import { ContratoClienteYaExisteError } from '../../domain/errors/contrato-cliente.errors';
import { ContratoClienteRepositoryPort } from '../../domain/ports/contrato-cliente-repository.port';
import { PlantillaContratoRepositoryPort } from '../../domain/ports/plantilla-contrato-repository.port';
import { DatosDocumentoContrato } from '../../domain/read-models/documento-contrato.read-model';

export class ContratoClienteRepositoryFake
  implements ContratoClienteRepositoryPort
{
  private readonly conContrato = new Set<number>();

  constructor(private readonly clientesVigentes: number[]) {}

  existeClienteVigente(clienteId: number): Promise<boolean> {
    return Promise.resolve(this.clientesVigentes.includes(clienteId));
  }

  create(contrato: ContratoClienteEntity): Promise<ContratoClienteEntity> {
    if (this.conContrato.has(contrato.clienteId)) {
      return Promise.reject(new ContratoClienteYaExisteError());
    }
    this.conContrato.add(contrato.clienteId);

    return Promise.resolve(
      ContratoClienteEntity.hydrate({
        ...contrato.toPrimitives(),
        id: this.conContrato.size,
      }),
    );
  }
}

export class PlantillaContratoRepositoryFake
  implements PlantillaContratoRepositoryPort
{
  private readonly filas = new Map<number, PlantillaContratoEntity>();
  private ultimoId = 0;

  create(plantilla: PlantillaContratoEntity): Promise<PlantillaContratoEntity> {
    this.ultimoId += 1;
    return this.update(
      PlantillaContratoEntity.hydrate({
        ...plantilla.toPrimitives(),
        id: this.ultimoId,
      }),
    );
  }

  update(plantilla: PlantillaContratoEntity): Promise<PlantillaContratoEntity> {
    this.filas.set(plantilla.id!, copia(plantilla));
    return Promise.resolve(copia(plantilla));
  }

  findById(id: number): Promise<PlantillaContratoEntity | null> {
    const fila = this.filas.get(id);
    return Promise.resolve(fila ? copia(fila) : null);
  }

  delete(id: number): Promise<boolean> {
    return Promise.resolve(this.filas.delete(id));
  }
}

function copia(plantilla: PlantillaContratoEntity): PlantillaContratoEntity {
  return PlantillaContratoEntity.hydrate(plantilla.toPrimitives());
}

export function datosDocumento(
  cambios: Partial<DatosDocumentoContrato> = {},
): DatosDocumentoContrato {
  const fecha = new Date('2026-11-01T18:00:00.000Z');

  return {
    empresa: {
      id: 1,
      nombre: 'Empresa de ejemplo',
      direccion: null,
      telefono: null,
      correo: null,
      pbx: null,
      sitioWeb: null,
    },
    instalacion: {
      id: 40,
      clienteId: 7,
      servicioInternetId: 2,
      fechaProgramada: fecha,
      fechaActivacionServicio: new Date('2026-11-16T03:00:00.000Z'),
      direccionInstalacion: null,
      referenciaUbicacion: null,
      costoInstalacion: 100,
      costoMateriales: 25.5,
      costoManoObra: 10,
      costoOtros: 0,
      observaciones: null,
      notasCostos: null,
      creadoEn: fecha,
      actualizadoEn: fecha,
    },
    cliente: {
      id: 7,
      nombre: 'Ana',
      apellidos: 'Pérez',
      dpi: null,
      telefono: null,
      direccion: 'Zona 1',
      contactoReferenciaNombre: null,
      contactoReferenciaTelefono: null,
    },
    servicio: { id: 2, nombre: 'Plan 10', velocidad: '10 Mbps', precio: 150 },
    diaPagoZona: 5,
    ...cambios,
  };
}
