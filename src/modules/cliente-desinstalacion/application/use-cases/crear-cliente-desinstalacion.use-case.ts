import { Inject, Injectable } from '@nestjs/common';
import { Money } from 'src/common/hexagonal/money.vo';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { RolTecnicoOperacionCliente } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';
import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entity';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';
import { ClienteDesinstalacionAccesoInvalidoError } from '../../domain/errors/cliente-desinstalacion.errors';
import { exigirUnSoloResponsable } from '../../domain/policies/tecnicos-desinstalacion.policy';
import {
  CLIENTE_DESINSTALACION_CONTEXTO_QUERY,
  ClienteDesinstalacionContextoQueryPort,
} from '../../domain/ports/cliente-desinstalacion-contexto-query.port';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
  ClienteDesinstalacionTecnicoRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-tecnico-repository.port';
import {
  ClienteDesinstalacionResumen,
  resumirDesinstalacion,
  resumirTecnico,
  TecnicoDesinstalacionResumen,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';

export type CrearClienteDesinstalacionInput = {
  creadoPorId: number;
  clienteId: number;
  accesoInternetId: number;
  ticketId?: number | null;
  tipo: TipoDesinstalacionCliente;
  motivo: MotivoDesinstalacionCliente;
  fechaProgramada: string;
  requiereRetiroEquipo?: boolean;
  observaciones?: string | null;
  tecnicos?: {
    tecnicoId?: number | null;
    rol?: RolTecnicoOperacionCliente;
    esResponsable?: boolean;
    tiempoMinutos?: number | null;
    observaciones?: string | null;
    tecnicoNombreSnapshot?: string | null;
  }[];
};

export type CrearClienteDesinstalacionResult = {
  desinstalacion: ClienteDesinstalacionResumen;
  tecnicos: TecnicoDesinstalacionResumen[];
};

/**
 * Registra la solicitud de desinstalación con sus técnicos, en una sola
 * transacción. La empresa y el servicio salen del acceso, no de la petición.
 */
@Injectable()
export class CrearClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_CONTEXTO_QUERY)
    private readonly contexto: ClienteDesinstalacionContextoQueryPort,

    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_TECNICO_REPOSITORY)
    private readonly tecnicos: ClienteDesinstalacionTecnicoRepositoryPort,

    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,

    private readonly validarAcceso: ValidarAccesoDesinstalacionService,
  ) {}

  async execute(
    input: CrearClienteDesinstalacionInput,
  ): Promise<CrearClienteDesinstalacionResult> {
    exigirUnSoloResponsable(input.tecnicos ?? []);

    const acceso = await this.validarAcceso.validar({
      clienteId: input.clienteId,
      accesoInternetId: input.accesoInternetId,
    });

    await this.exigirTicketDelCliente(input.ticketId, input.clienteId);

    const entidad = ClienteDesinstalacionEntity.create({
      empresaId: acceso.empresaId,
      clienteId: input.clienteId,
      servicioInternetId: acceso.servicioInternetId as number,
      accesoInternetId: input.accesoInternetId,
      ticketId: input.ticketId ?? null,
      // Quien registra la solicitud queda como solicitante; el ejecutor se
      // conoce hasta que se inicia.
      solicitadoPorId: input.creadoPorId,
      creadoPorId: input.creadoPorId,
      ejecutadoPorId: null,
      tipo: input.tipo,
      motivo: input.motivo,
      fechaSolicitud: this.reloj.ahora(),
      fechaProgramada: new Date(input.fechaProgramada),
      requiereRetiroEquipo: input.requiereRetiroEquipo ?? true,
      observaciones: input.observaciones ?? null,
      // La ubicación pertenece al servicio ya instalado y no se captura de nuevo.
      direccionServicio: null,
      referenciaUbicacion: null,
      latitud: null,
      longitud: null,
      // No se confía en un saldo enviado por la pantalla.
      saldoClienteAlMomento: Money.zero(),
    });

    return this.unidad.ejecutar(async () => {
      const guardada = await this.desinstalaciones.create(entidad);
      const desinstalacionId = guardada.id as number;

      const guardados = await this.tecnicos.createMany(
        (input.tecnicos ?? []).map((tecnico) =>
          ClienteDesinstalacionTecnicoEntity.create({
            desinstalacionId,
            tecnicoId: tecnico.tecnicoId ?? null,
            rol: tecnico.rol,
            esResponsable: tecnico.esResponsable ?? false,
            tiempoMinutos: tecnico.tiempoMinutos ?? null,
            observaciones: tecnico.observaciones ?? null,
            tecnicoNombreSnapshot: tecnico.tecnicoNombreSnapshot ?? null,
          }),
        ),
      );

      return {
        desinstalacion: resumirDesinstalacion(guardada),
        tecnicos: guardados.map(resumirTecnico),
      };
    });
  }

  private async exigirTicketDelCliente(
    ticketId: number | null | undefined,
    clienteId: number,
  ): Promise<void> {
    if (ticketId === undefined || ticketId === null) {
      return;
    }

    if (!(await this.contexto.existsTicketForClient(ticketId, clienteId))) {
      throw new ClienteDesinstalacionAccesoInvalidoError(
        'El ticket indicado no pertenece al cliente.',
      );
    }
  }
}
