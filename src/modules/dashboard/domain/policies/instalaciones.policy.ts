import {
  InstalacionesHistoricasReadModel,
  InstalacionesMesReadModel,
  TrabajosDeCampoFinalizados,
} from '../read-models/instalaciones.read-model';
import {
  diaDelMes,
  inicioDeMes,
  sumarDias,
  sumarMeses,
} from './calendario.policy';
import { redondear } from './estadisticas.policy';

const MESES_HISTORICO = 12;

/** Día por día del mes en curso, solo hasta hoy. */
export function actividadDelMes(
  hoy: string,
  datos: TrabajosDeCampoFinalizados,
): InstalacionesMesReadModel {
  const desde = inicioDeMes(hoy);
  const instalaciones = contarPor(datos.instalaciones, (f) => f);
  const desinstalaciones = contarPor(datos.desinstalaciones, (f) => f);

  return {
    periodo: { desde, hasta: hoy },
    totales: totales(datos),
    actividadDiaria: Array.from({ length: diaDelMes(hoy) }, (_, i) => {
      const fecha = sumarDias(desde, i);
      return {
        fecha,
        instalaciones: instalaciones.get(fecha) ?? 0,
        desinstalaciones: desinstalaciones.get(fecha) ?? 0,
      };
    }),
  };
}

/** Primer día de la ventana de doce meses que termina en el mes de `hoy`. */
export function inicioHistorico(hoy: string): string {
  return sumarMeses(inicioDeMes(hoy), -(MESES_HISTORICO - 1));
}

export function actividadHistorica(
  hoy: string,
  datos: TrabajosDeCampoFinalizados,
): InstalacionesHistoricasReadModel {
  const desde = inicioHistorico(hoy);
  const mesDe = (fecha: string) => fecha.slice(0, 7);
  const instalaciones = contarPor(datos.instalaciones, mesDe);
  const desinstalaciones = contarPor(datos.desinstalaciones, mesDe);
  const suma = totales(datos);

  return {
    periodo: { desde, hasta: hoy, meses: MESES_HISTORICO },
    totales: {
      ...suma,
      promedioInstalacionesMes: redondear(suma.instalaciones / MESES_HISTORICO),
      promedioDesinstalacionesMes: redondear(
        suma.desinstalaciones / MESES_HISTORICO,
      ),
    },
    actividadMensual: Array.from({ length: MESES_HISTORICO }, (_, i) => {
      const mes = mesDe(sumarMeses(desde, i));
      const altas = instalaciones.get(mes) ?? 0;
      const bajas = desinstalaciones.get(mes) ?? 0;
      return {
        mes,
        instalaciones: altas,
        desinstalaciones: bajas,
        balance: altas - bajas,
      };
    }),
  };
}

function totales(datos: TrabajosDeCampoFinalizados) {
  const instalaciones = datos.instalaciones.length;
  const desinstalaciones = datos.desinstalaciones.length;

  return {
    instalaciones,
    desinstalaciones,
    balance: instalaciones - desinstalaciones,
  };
}

function contarPor(
  fechas: string[],
  clave: (fecha: string) => string,
): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const fecha of fechas) {
    const k = clave(fecha);
    conteo.set(k, (conteo.get(k) ?? 0) + 1);
  }
  return conteo;
}
