import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  ZONA_FACTURACION,
  ZonaFacturacionFacadePort,
} from '../../../zona-facturacion/public/zona-facturacion.facade.port';
import {
  SERVICIO,
  ServicioFacadePort,
} from '../../../servicio/public/servicio.facade.port';
import {
  UBICACION,
  UbicacionFacadePort,
} from '../../../ubicacion/public/ubicacion.facade.port';
import { ClienteEntity } from '../../domain/entities/cliente.entity';
import {
  EstadoClientePersistido,
  EstadoOperativoCliente,
} from '../../domain/enums/estado-operativo-cliente.enum';
import { TipoCambioCliente } from '../../domain/enums/tipo-cambio-cliente.enum';
import {
  ClienteEliminadoError,
  ClienteNoEncontradoError,
} from '../../domain/errors/cliente.errors';
import { leerCoordenadas } from '../../domain/policies/coordenadas.policy';
import {
  CLIENTE_REPOSITORY,
  ClienteRepositoryPort,
} from '../../domain/ports/cliente-repository.port';
import {
  ActualizarAsignacionesCliente,
  ActualizarPerfilCliente,
} from '../../domain/props/cliente.props';
import {
  CONTRATO_CLIENTE,
  ContratoClienteFacadePort,
  GuardarContratoFisicoInput,
} from '../../../contrato-cliente/public/contrato-cliente.facade.port';

export type ActualizarClienteInput = {
  clienteId: number;
  usuarioId: number;
  empresaId: number;
  perfil: ActualizarPerfilCliente;
  asignaciones: ActualizarAsignacionesCliente;
  estado?: EstadoClientePersistido;
  coordenadas?: string[];
  /** `undefined` conserva los servicios; una lista vacía los quita. */
  servicioIds?: number[];
  contrato?: Omit<GuardarContratoFisicoInput, 'clienteId'> | null;
};

function ubicacionDe(cliente: ClienteEntity) {
  const { departamentoId, municipioId, sectorId } = cliente.toPrimitives();

  return { departamentoId, municipioId, sectorId };
}

/**
 * Edición de un cliente: lo que no llega no se modifica. La cobranza no se
 * edita (sale de las facturas). Un cambio de estado queda en el historial.
 */
@Injectable()
export class ActualizarClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepositoryPort,
    @Inject(CONTRATO_CLIENTE)
    private readonly contratos: ContratoClienteFacadePort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(ZONA_FACTURACION)
    private readonly zonas: ZonaFacturacionFacadePort,
    @Inject(SERVICIO)
    private readonly servicios: ServicioFacadePort,
    @Inject(UBICACION)
    private readonly ubicaciones: UbicacionFacadePort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  execute(input: ActualizarClienteInput): Promise<ClienteEntity> {
    return this.unidad.ejecutar(async () => {
      const cliente = await this.clientes.findById(input.clienteId);
      if (!cliente) throw new ClienteNoEncontradoError();
      if (cliente.isEliminado) throw new ClienteEliminadoError();

      const { facturacionZonaId } = input.asignaciones;
      if (typeof facturacionZonaId === 'number') {
        await this.zonas.verificarAsignable(facturacionZonaId);
      }

      // Antes de escribir: lo que el cliente ya tiene se admite aunque esté
      // inactivo.
      const { servicioInternetId } = input.asignaciones;
      if (typeof servicioInternetId === 'number') {
        await this.servicios.verificarPlanAsignable({
          planId: servicioInternetId,
          clienteId: input.clienteId,
        });
      }
      if (input.servicioIds !== undefined) {
        await this.servicios.verificarServiciosAsignables({
          servicioIds: input.servicioIds,
          clienteId: input.clienteId,
        });
      }

      const estadoAnterior = cliente.estadoCliente;
      const ubicacionAnterior = ubicacionDe(cliente);

      cliente.actualizarPerfil(input.perfil);
      cliente.actualizarAsignaciones(input.asignaciones);
      // Solo se comprueba lo que cambia, y antes de guardar.
      await this.ubicaciones.verificarAsignacion({
        nueva: ubicacionDe(cliente),
        anterior: ubicacionAnterior,
      });
      if (input.estado !== undefined) {
        cliente.ajustarEstadoOperativo(input.estado, this.reloj.ahora());
      }

      const guardado = await this.clientes.update(cliente);

      const coordenadas = leerCoordenadas(input.coordenadas);
      if (coordenadas) {
        await this.clientes.guardarUbicacion(
          input.clienteId,
          guardado.empresaId ?? input.empresaId,
          coordenadas,
        );
      }
      if (input.servicioIds !== undefined) {
        await this.clientes.reemplazarServicios(
          input.clienteId,
          input.servicioIds,
          guardado.toPrimitives().fechaInstalacion,
        );
      }
      if (input.contrato?.idContrato) {
        await this.contratos.guardarContratoFisico({
          ...input.contrato,
          clienteId: input.clienteId,
        });
      }

      if (guardado.estadoCliente !== estadoAnterior) {
        await this.clientes.registrarCambio({
          empresaId: guardado.empresaId ?? input.empresaId,
          clienteId: input.clienteId,
          tipoCambio:
            guardado.estadoCliente === EstadoOperativoCliente.DESINSTALADO
              ? TipoCambioCliente.DESINSTALACION
              : TipoCambioCliente.CAMBIO_ESTADO,
          estadoAnterior,
          estadoNuevo: guardado.estadoCliente,
          motivo: null,
          descripcion: 'Cambio manual desde la edición del cliente.',
          cambiadoPorId: input.usuarioId,
        });
      }

      return guardado;
    });
  }
}
