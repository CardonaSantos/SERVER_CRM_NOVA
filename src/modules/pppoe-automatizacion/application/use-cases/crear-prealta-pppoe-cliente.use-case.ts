import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { ClienteAccesoInternetEntity } from 'src/modules/pppoe-acceso-internet/domain/entities/ppoe-acceso-internet.entity';

import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import { ClienteAccesoInternetRepositoryPort } from 'src/modules/pppoe-acceso-internet/domain/ports/ppoe-acceso-internet.port';

import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from 'src/modules/pppoe-acceso-internet/infra/tokens/token-ppoe-acceso-internet.token';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

import {
  PPPOE_PREALTA,
  PppoePrealtaPort,
} from '../../domain/ports/pppoe-prealta.port';

import { PrepararPrealtaPppoeResult } from '../results/preparar-prealta-pppoe.result';

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
    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesoInternetRepository: ClienteAccesoInternetRepositoryPort,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaPppoeRepository: ClientePppoeCuentaRepositoryPort,

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
  ): Promise<ClienteAccesoInternetEntity> {
    /*
     * Buscamos exclusivamente un ciclo PPPoE vigente.
     *
     * Un acceso en BAJA pertenece a un ciclo ya terminado y
     * no debe ser reutilizado ni impedir una nueva prealta.
     */
    const accesoExistente =
      await this.accesoInternetRepository.findPppoeVigenteByClienteId({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
      });

    if (!accesoExistente) {
      return this.crearAccesoInternet(input);
    }

    if (accesoExistente.id === null) {
      throw new Error(
        'El acceso PPPoE existente no tiene un identificador persistido.',
      );
    }

    const cuentaExistente =
      await this.cuentaPppoeRepository.findByAccesoInternetId(
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
  ): Promise<ClienteAccesoInternetEntity> {
    const acceso = ClienteAccesoInternetEntity.create({
      empresaId: input.empresaId,

      clienteId: input.clienteId,
      servicioInternetId: input.servicioInternetId,

      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    });

    return this.accesoInternetRepository.create(acceso);
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
