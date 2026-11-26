import { Inject, Injectable } from '@nestjs/common';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import { ModoAccesoInstalacion } from '../../domain/enums/modo-acceso-instalacion.enum';
import { RolTecnicoOperacionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';
import { TipoInstalacionCliente } from '../../domain/enums/tipo-instalacion-cliente.enum';
import { validarAccesoNuevo } from '../../domain/policies/acceso-instalacion.policy';
import { normalizarTecnicosInstalacion } from '../../domain/policies/tecnicos-instalacion.policy';
import {
  CLIENTE_INSTALACION_QUERY,
  ClienteInstalacionQueryPort,
} from '../../domain/ports/cliente-instalacion-query.port';
import {
  CLIENTE_INSTALACION_REPOSITORY,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion-repository.port';
import { CoordenadasInstalacion } from '../../domain/value-objects/coordenadas-instalacion.vo';
import { ClienteInstalacionDetalle } from '../../domain/read-models/cliente-instalacion-detalle.read-model';
import { ClienteInstalacionNoEncontradaError } from '../../domain/errors/cliente-instalacion.errors';
import {
  AccesoInstalacionEntrada,
  ClienteInstalacionAccesoResult,
  PREALTA_NO_APLICA,
  PrealtaPppoeInstalacionResult,
  ProvisionarAccesoInstalacionService,
} from '../services/provisionar-acceso-instalacion.service';
import { esGponPppoe } from '../../domain/policies/acceso-instalacion.policy';

export type CrearClienteInstalacionInput = {
  creadoPorId: number;
  /** La tabla exige empresa al insertar; sale del usuario autenticado. */
  empresaId: number;
  clienteId: number;
  servicioInternetId?: number;
  ticketId?: number;
  asesorId?: number;

  acceso: AccesoInstalacionEntrada;

  tipo?: TipoInstalacionCliente;
  estado?: EstadoInstalacionCliente;
  descripcion?: string;
  motivo?: string;
  observaciones?: string;

  fechaProgramada?: string;
  fechaInicio?: string;

  direccionInstalacion?: string;
  referenciaUbicacion?: string;
  /** `"latitud, longitud"`. */
  coordenadas?: string;

  costos?: {
    costoInstalacion?: number;
    costoMateriales?: number;
    costoManoObra?: number;
    costoOtros?: number;
    montoCobradoCliente?: number;
    notas?: string;
  };

  tecnicos?: {
    tecnicoId: number;
    rol?: RolTecnicoOperacionCliente;
    esResponsable?: boolean;
    observaciones?: string | null;
  }[];
};

export type CrearClienteInstalacionResult = {
  detalle: ClienteInstalacionDetalle;
  acceso: ClienteInstalacionAccesoResult;
  prealtaPppoe: PrealtaPppoeInstalacionResult;
};

/**
 * Crea la instalación con sus técnicos y deja ligado su acceso de internet,
 * todo en una sola transacción. La prealta PPPoE va después y por separado:
 * si falla, la instalación ya existe y la prealta se reintenta.
 */
@Injectable()
export class CrearClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalaciones: ClienteInstalacionRepositoryPort,

    @Inject(CLIENTE_INSTALACION_QUERY)
    private readonly consultas: ClienteInstalacionQueryPort,

    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,

    private readonly accesos: ProvisionarAccesoInstalacionService,
  ) {}

  async execute(
    input: CrearClienteInstalacionInput,
  ): Promise<CrearClienteInstalacionResult> {
    // Todo se valida antes de escribir.
    const tecnicos = normalizarTecnicosInstalacion(input.tecnicos ?? []);
    const coordenadas = CoordenadasInstalacion.desdeTexto(input.coordenadas);
    const servicioInternetId = input.servicioInternetId ?? null;

    if (input.acceso.modo === ModoAccesoInstalacion.NUEVO) {
      validarAccesoNuevo({
        tecnologia: input.acceso.tecnologia,
        metodoAutenticacion: input.acceso.metodoAutenticacion,
        servicioInternetId,
        mikrotikRouterId: input.acceso.mikrotikRouterId ?? null,
      });
    }

    const entidad = ClienteInstalacionEntity.create({
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      servicioInternetId,
      ticketId: input.ticketId ?? null,
      asesorId: input.asesorId ?? null,
      creadoPorId: input.creadoPorId,
      tipo: input.tipo,
      estado: input.estado,
      descripcion: input.descripcion ?? null,
      motivo: input.motivo ?? null,
      observaciones: input.observaciones ?? null,
      fechaProgramada: input.fechaProgramada
        ? new Date(input.fechaProgramada)
        : null,
      fechaInicio: input.fechaInicio ? new Date(input.fechaInicio) : null,
      direccionInstalacion: input.direccionInstalacion ?? null,
      referenciaUbicacion: input.referenciaUbicacion ?? null,
      latitud: coordenadas?.latitud ?? null,
      longitud: coordenadas?.longitud ?? null,
      costos: input.costos && {
        ...input.costos,
        notas: input.costos.notas ?? null,
      },
    });

    const { instalacionId, acceso } = await this.unidad.ejecutar(async () => {
      const creada = await this.instalaciones.create(entidad, tecnicos);
      const id = creada.id as number;

      return {
        instalacionId: id,
        acceso: await this.accesos.vincularAcceso({
          instalacionId: id,
          empresaId: input.empresaId,
          clienteId: input.clienteId,
          servicioInternetId,
          acceso: input.acceso,
        }),
      };
    });

    const prealtaPppoe = await this.prepararPrealta({
      input,
      acceso,
      instalacionId,
      servicioInternetId,
    });

    const detalle = await this.consultas.findDetailById(instalacionId);

    if (!detalle) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    return { detalle, acceso, prealtaPppoe };
  }

  private async prepararPrealta(datos: {
    input: CrearClienteInstalacionInput;
    acceso: ClienteInstalacionAccesoResult;
    instalacionId: number;
    servicioInternetId: number | null;
  }): Promise<PrealtaPppoeInstalacionResult> {
    const { input, acceso, servicioInternetId } = datos;

    // Un acceso existente no genera prealta automática.
    if (
      acceso.modo !== ModoAccesoInstalacion.NUEVO ||
      !esGponPppoe(acceso.tecnologia, acceso.metodoAutenticacion) ||
      servicioInternetId === null ||
      acceso.mikrotikRouterId === null
    ) {
      return PREALTA_NO_APLICA;
    }

    return this.accesos.prepararPrealta({
      instalacionId: datos.instalacionId,
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      servicioInternetId,
      accesoInternetId: acceso.accesoInternetId,
      mikrotikRouterId: acceso.mikrotikRouterId,
      operadorId: input.creadoPorId,
    });
  }
}
