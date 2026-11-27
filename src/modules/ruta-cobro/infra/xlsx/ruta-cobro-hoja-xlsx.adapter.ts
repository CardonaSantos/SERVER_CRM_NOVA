import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ZONA_HORARIA_NEGOCIO } from 'src/common/reloj/fecha-negocio';
import { dayjs } from 'src/Utils/dayjs.config';
import { RutaCobroHojaPort } from '../../application/ports/ruta-cobro-hoja.port';
import {
  ClienteDeRuta,
  RutaCobroDetalle,
} from '../../domain/read-models/ruta-cobro.read-model';

const COLUMNAS: Partial<ExcelJS.Column>[] = [
  { header: 'Nombre', key: 'nombre', width: 35 },
  { header: 'Teléfono', key: 'telefono', width: 15 },
  { header: 'Tel. Referencia', key: 'telefonoReferencia', width: 18 },
  { header: 'Dirección', key: 'direccion', width: 40 },
  { header: 'Sector', key: 'sector', width: 20 },
  { header: 'Facturas Pendientes', key: 'facturas', width: 40 },
  { header: 'Saldo Total (Q)', key: 'saldo', width: 16 },
  { header: 'Plan', key: 'plan', width: 25 },
  { header: 'Fecha Instalación', key: 'fechaInstalacion', width: 22 },
  { header: 'Observaciones', key: 'observaciones', width: 25 },
  { header: 'Ubicación', key: 'ubicacion', width: 40 },
];

/** Excel no admite estos caracteres ni más de 31 en el nombre de una hoja. */
export function nombreDeHoja(nombre: string): string {
  const limpio = nombre
    .replace(/[\\/*?:[\]]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31)
    .replace(/^'+|'+$/g, '');

  return limpio || 'Ruta';
}

/** `202611` → `noviembre 2026`. */
const mesFacturado = (periodo: string): string =>
  dayjs
    .utc(`${periodo.slice(0, 4)}-${periodo.slice(4, 6)}-01`)
    .locale('es')
    .format('MMMM YYYY');

@Injectable()
export class RutaCobroHojaXlsxAdapter implements RutaCobroHojaPort {
  async generar(ruta: RutaCobroDetalle): Promise<Buffer> {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet(nombreDeHoja(ruta.nombre));

    hoja.columns = COLUMNAS;
    hoja.getColumn('facturas').alignment = { wrapText: true };
    hoja.getColumn('direccion').alignment = { wrapText: true };
    hoja.getColumn('saldo').numFmt = '#,##0.00';
    ruta.clientes.forEach((cliente) => hoja.addRow(this.fila(cliente)));

    return Buffer.from(await libro.xlsx.writeBuffer());
  }

  private fila(c: ClienteDeRuta) {
    return {
      nombre: [c.nombre, c.apellidos].filter(Boolean).join(' '),
      telefono: c.telefono ?? '',
      telefonoReferencia: c.contactoReferencia.telefono ?? '',
      direccion: c.direccion ?? '',
      sector: c.sector ?? '',
      facturas: c.facturas
        .map(
          (f) =>
            `Mes: ${mesFacturado(f.periodo)}, Saldo: Q${f.saldoPendiente.toFixed(2)}`,
        )
        .join('\n'),
      saldo: c.saldoPendiente,
      plan: c.plan ?? '',
      fechaInstalacion: c.fechaInstalacion
        ? dayjs(c.fechaInstalacion)
            .tz(ZONA_HORARIA_NEGOCIO)
            .locale('es')
            .format('DD MMMM YYYY')
        : '',
      observaciones: c.observaciones ?? '',
      ubicacion: c.ubicacion
        ? `${c.ubicacion.latitud},${c.ubicacion.longitud}`
        : '',
    };
  }
}
