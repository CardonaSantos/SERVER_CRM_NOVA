import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  AccesoInternetReadModel,
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';

import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';

import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';

import {
  PPPOE_PREALTA,
  PppoePrealtaPort,
  PrepararPrealtaPppoeResult,
} from '../../public/pppoe-prealta.port';

export type CrearPrealtaPppoeClienteInput = {
  empresaId: number;

  clienteId: number;
  servicioInternetId: number;
  mikrotikRouterId: number;

  operadorId: number;
  operadorNombre?: string | null;

  ipOrigen?: string | null;
  userAgent?: string | null;

  fechaReferencia?: Date;
};

@Injectable()
export class CrearPrealtaPppoeClienteUseCase {
  constructor(
    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesosInternet: PppoeAccesoInternetFacadePort,

    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,

    @Inject(PPPOE_PREALTA)
    private readonly pppoePrealta: PppoePrealtaPort,
  ) {}

  async execute(
    input: CrearPrealtaPppoeClienteInput,
  ): Promise<PrepararPrealtaPppoeResult> {
    this.validateInput(input);

    const acceso = await this.resolverAccesoInternet(input);

    if (acceso.id === null) {
      throw new Error(
        'El acceso de internet no tiene un identificador persistido.',
      );
    }

    return this.pppoePrealta.preparar({
      empresaId: input.empresaId,

      clienteId: input.clienteId,
      accesoInternetId: acceso.id,
      servicioInternetId: input.servicioInternetId,
      mikrotikRouterId: input.mikrotikRouterId,

      instalacionId: null,

      operadorId: input.operadorId,
      operadorNombre: input.operadorNombre ?? null,

      ipOrigen: input.ipOrigen ?? null,
      userAgent: input.userAgent ?? null,

      fechaReferencia: input.fechaReferencia,
    });
  }

  private async resolverAccesoInternet(
    input: CrearPrealtaPppoeClienteInput,
  ): Promise<AccesoInternetReadModel> {
    /*
     * Buscamos exclusivamente un ciclo PPPoE vigente.
     *
     * Un acceso en BAJA pertenece a un ciclo ya terminado y
     * no debe ser reutilizado ni impedir una nueva prealta.
     */
    const accesoExistente =
      await this.accesosInternet.buscarPppoeVigenteDelCliente(input.clienteId);

    if (!accesoExistente) {
      return this.crearAccesoInternet(input);
    }

    if (accesoExistente.id === null) {
      throw new Error(
        'El acceso PPPoE existente no tiene un identificador persistido.',
      );
    }

    const cuentaExistente = await this.cuentasPppoe.buscarPorAccesoInternet(
      accesoExistente.id,
    );

    if (cuentaExistente) {
      throw new ConflictException(
        'El cliente ya posee una cuenta PPPoE asociada.',
      );
    }

    /*
     * Caso de recuperación:
     *
     * una ejecución anterior pudo haber creado
     * ClienteAccesoInternet y fallar antes de crear
     * ClientePppoeCuenta.
     *
     * Reutilizamos únicamente un acceso todavía PENDIENTE.
     */
    if (accesoExistente.estado !== EstadoAccesoInternet.PENDIENTE) {
      throw new ConflictException(
        `El cliente ya posee un acceso PPPoE en estado ${accesoExistente.estado}, pero no tiene una cuenta PPPoE asociada. Se requiere revisión antes de continuar.`,
      );
    }

    if (accesoExistente.tecnologia !== TecnologiaAccesoInternet.FIBRA_GPON) {
      throw new ConflictException(
        'El acceso PPPoE pendiente del cliente no utiliza tecnología FIBRA_GPON.',
      );
    }

    if (accesoExistente.servicioInternetId !== input.servicioInternetId) {
      throw new ConflictException(
        'El acceso PPPoE pendiente del cliente pertenece a un servicio de internet diferente.',
      );
    }

    return accesoExistente;
  }

  private async crearAccesoInternet(
    input: CrearPrealtaPppoeClienteInput,
  ): Promise<AccesoInternetReadModel> {
    return this.accesosInternet.crear({
      empresaId: input.empresaId,

      clienteId: input.clienteId,
      servicioInternetId: input.servicioInternetId,

      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    });
  }

  private validateInput(input: CrearPrealtaPppoeClienteInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');
    this.assertPositiveInteger(input.clienteId, 'clienteId');
    this.assertPositiveInteger(input.servicioInternetId, 'servicioInternetId');
    this.assertPositiveInteger(input.mikrotikRouterId, 'mikrotikRouterId');
    this.assertPositiveInteger(input.operadorId, 'operadorId');

    if (
      input.fechaReferencia !== undefined &&
      (!(input.fechaReferencia instanceof Date) ||
        Number.isNaN(input.fechaReferencia.getTime()))
    ) {
      throw new BadRequestException(
        'fechaReferencia debe ser una fecha válida.',
      );
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
