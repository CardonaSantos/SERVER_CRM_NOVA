import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  inicioDeMes,
  sumarMeses,
} from '../../domain/policies/calendario.policy';
import {
  RESUMEN_QUERY,
  ResumenQueryPort,
} from '../../domain/ports/resumen-query.port';
import { ResumenDashboardReadModel } from '../../domain/read-models/resumen.read-model';

@Injectable()
export class ObtenerResumenUseCase {
  constructor(
    @Inject(RESUMEN_QUERY) private readonly resumen: ResumenQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(): Promise<ResumenDashboardReadModel> {
    const hoy = this.reloj.fechaOperativa();
    const desde = inicioDeMes(hoy);

    const datos = await this.resumen.findDatos({
      desde,
      hastaExclusivo: sumarMeses(desde, 1),
    });
    const { activos, suspendidos, pendientesActivacion, enInstalacion } =
      datos.servicio;

    return {
      periodo: { desde, hasta: hoy },
      clientes: {
        resumen: {
          totalEnSistema: datos.totalEnSistema,
          // La cartera actual no incluye a los desinstalados.
          carteraActual:
            activos + suspendidos + pendientesActivacion + enInstalacion,
        },
        servicio: datos.servicio,
        cobranza: datos.cobranza,
      },
      facturacion: datos.facturacion,
    };
  }
}
