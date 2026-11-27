import * as ExcelJS from 'exceljs';
import { EstadoRutaCobro } from '../../domain/enums/estado-ruta-cobro.enum';
import { RutaCobroDetalle } from '../../domain/read-models/ruta-cobro.read-model';
import {
  nombreDeHoja,
  RutaCobroHojaXlsxAdapter,
} from './ruta-cobro-hoja-xlsx.adapter';

const FECHA = new Date('2026-11-01T06:00:00.000Z');

const ruta: RutaCobroDetalle = {
  id: 1,
  nombre: 'Norte / Sur',
  estado: EstadoRutaCobro.ASIGNADA,
  observaciones: null,
  cobrador: null,
  creadoEn: FECHA,
  actualizadoEn: FECHA,
  totales: {
    clientes: 1,
    clientesCobrados: 0,
    facturasPendientes: 1,
    porCobrar: 50,
    cobrado: 0,
  },
  clientes: [
    {
      id: 7,
      nombre: 'Ana',
      apellidos: null,
      telefono: null,
      direccion: 'Calle 1',
      contactoReferencia: { nombre: null, telefono: null },
      estadoCliente: 'ACTIVO',
      zonaFacturacion: null,
      sector: 'Centro',
      plan: 'Plan 10',
      // Las 20:00 del 31 de octubre en Guatemala.
      fechaInstalacion: new Date('2026-11-01T02:00:00.000Z'),
      observaciones: null,
      ubicacion: { latitud: 15.5, longitud: -91.5 },
      saldoPendiente: 50,
      ultimoPago: null,
      facturas: [
        {
          id: 1,
          periodo: '202611',
          montoPago: 150,
          saldoPendiente: 50,
          estado: 'PARCIAL',
          detalleFactura: null,
          creadoEn: FECHA,
          fechaPagoEsperada: FECHA,
        },
      ],
    },
  ],
};

describe('hoja de una ruta de cobro', () => {
  it('limpia el nombre de la hoja', () => {
    expect(nombreDeHoja('Norte / Sur [1]')).toBe('Norte - Sur -1-');
    expect(nombreDeHoja("'''")).toBe('Ruta');
    expect(nombreDeHoja('x'.repeat(40))).toHaveLength(31);
  });

  it('muestra lo que falta pagar y las fechas de Guatemala', async () => {
    const buffer = await new RutaCobroHojaXlsxAdapter().generar(ruta);

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const hoja = libro.worksheets[0];
    const fila = hoja.getRow(2).values as unknown[];

    expect(hoja.name).toBe('Norte - Sur');
    expect(fila).toEqual(
      expect.arrayContaining([
        'Ana',
        'Mes: noviembre 2026, Saldo: Q50.00',
        50,
        '31 octubre 2026',
        '15.5,-91.5',
      ]),
    );
  });
});
