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
  FACTURACION,
  FacturacionFacadePort,
} from '../../../facturacion/public/facturacion.facade.port';
import {
  SERVICIO,
  ServicioFacadePort,
} from '../../../servicio/public/servicio.facade.port';
import {
  UBICACION,
  UbicacionFacadePort,
} from '../../../ubicacion/public/ubicacion.facade.port';
import { ClienteEntity } from '../../domain/entities/cliente.entity';
import { leerCoordenadas } from '../../domain/policies/coordenadas.policy';
import {
  CLIENTE_REPOSITORY,
  ClienteRepositoryPort,
  GuardarIpCliente,
} from '../../domain/ports/cliente-repository.port';
import { CrearClienteProps } from '../../domain/props/cliente.props';
import {
  CONTRATO_FISICO,
  ContratoFisicoPort,
  GuardarContratoFisico,
} from '../ports/contrato-fisico.port';

export type CrearClienteInput = {
  cliente: CrearClienteProps & {
    empresaId: number;
    servicioInternetId: number;
    facturacionZonaId: number;
  };
  ip: GuardarIpCliente;
  coordenadas?: string[];
  servicioIds: number[];
  /** Sin número no se registra contrato. */
  contrato?: Omit<GuardarContratoFisico, 'clienteId'> | null;
};

/**
 * Alta de un cliente con su IP, ubicación, servicios, primera factura y
 * contrato. Todo o nada.
 */
@Injectable()
export class CrearClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepositoryPort,
    @Inject(FACTURACION)
    private readonly facturacion: FacturacionFacadePort,
    @Inject(CONTRATO_FISICO)
    private readonly contratos: ContratoFisicoPort,
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

  execute(input: CrearClienteInput): Promise<ClienteEntity> {
    const ahora = this.reloj.ahora();
    const nuevo = ClienteEntity.create(input.cliente, ahora);

    return this.unidad.ejecutar(async () => {
      await this.zonas.verificarAsignable(input.cliente.facturacionZonaId);
      await this.servicios.verificarPlanAsignable({
        planId: input.cliente.servicioInternetId,
      });
      await this.servicios.verificarServiciosAsignables({
        servicioIds: input.servicioIds,
      });

      const { departamentoId, municipioId, sectorId } = nuevo.toPrimitives();
      await this.ubicaciones.verificarAsignacion({
        nueva: { departamentoId, municipioId, sectorId },
      });

      const cliente = await this.clientes.create(nuevo);
      const clienteId = cliente.id!;
      const props = cliente.toPrimitives();

      const coordenadas = leerCoordenadas(input.coordenadas);
      if (coordenadas) {
        await this.clientes.guardarUbicacion(
          clienteId,
          input.cliente.empresaId,
          coordenadas,
        );
      }

      await this.clientes.guardarIp(clienteId, input.ip);
      await this.clientes.reemplazarServicios(
        clienteId,
        input.servicioIds,
        props.fechaInstalacion,
      );

      const { estadoCobranza } = await this.facturacion.generarPrimeraFactura({
        clienteId,
        empresaId: input.cliente.empresaId,
        nombre: props.nombre,
        apellidos: props.apellidos,
        zonaFacturacionId: input.cliente.facturacionZonaId,
        servicioInternetId: input.cliente.servicioInternetId,
        ahora,
      });
      cliente.registrarCobranzaInicial(estadoCobranza);
      const guardado = await this.clientes.update(cliente);

      if (input.contrato?.idContrato) {
        await this.contratos.guardar({ ...input.contrato, clienteId });
      }

      return guardado;
    });
  }
}
