import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  ClienteInstalacionRepositoryPort,
  ClienteInstalacionTechnicalResult,
  InstalacionTecnicaAccion,
} from '../../domain/ports/cliente-instalacion.repository.port';

import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

export type ObtenerDetalleTecnicoInstalacionInput = {
  instalacionId: number;

  /**
   * Se obtiene exclusivamente del JWT.
   */
  actorId: number;
};

@Injectable()
export class ObtenerDetalleTecnicoInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    input: ObtenerDetalleTecnicoInstalacionInput,
  ): Promise<ClienteInstalacionTechnicalResult> {
    const detalle = await this.instalacionRepository.findTechnicalDetailById(
      input.instalacionId,
      input.actorId,
    );

    if (!detalle) {
      throw new NotFoundException(
        `No se encontró la instalación ${input.instalacionId}.`,
      );
    }

    // const props = detalle.instalacion.getProps();
    const props = detalle.instalacion.toPrimitives();

    const puedeIniciar = ['PROGRAMADA', 'REPROGRAMADA'].includes(props.estado);

    const puedeCompletar = props.estado === 'EN_PROCESO';

    const puedeCancelar = ['PROGRAMADA', 'REPROGRAMADA', 'EN_PROCESO'].includes(
      props.estado,
    );

    const tieneCuentaPppoe = detalle.accesos.some(
      (acceso) => acceso.cuentaPppoe !== null,
    );

    const requiereReintentoPrealta = detalle.accesos.some(
      (acceso) =>
        acceso.metodoAutenticacion === 'PPPOE' && acceso.cuentaPppoe === null,
    );

    return {
      ...detalle,

      acciones: {
        reprogramar: this.accion(
          puedeIniciar,
          'La instalación ya no puede reprogramarse en su estado actual.',
        ),

        iniciar: this.accion(
          puedeIniciar,
          'Solo se puede iniciar una instalación programada o reprogramada.',
        ),

        completar: this.accion(
          puedeCompletar,
          'La instalación debe estar en proceso antes de completarse.',
        ),

        cancelar: this.accion(
          puedeCancelar,
          'La instalación ya no admite cancelación.',
        ),

        subirEvidencia: this.accion(
          props.estado !== 'CANCELADA',
          'No se pueden agregar evidencias a una instalación cancelada.',
        ),

        revelarCredenciales: this.accion(
          tieneCuentaPppoe,
          'La instalación no tiene una cuenta PPPoE preparada.',
        ),

        reintentarPrealta: this.accion(
          requiereReintentoPrealta,
          'No existen accesos PPPoE pendientes de prealta.',
        ),
      },
    };
  }

  private accion(
    habilitada: boolean,
    motivoDeshabilitada: string,
  ): InstalacionTecnicaAccion {
    return {
      habilitada,

      motivo: habilitada ? null : motivoDeshabilitada,
    };
  }
}
