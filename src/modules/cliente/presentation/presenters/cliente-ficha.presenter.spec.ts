import { ClienteDetalleReadModel } from '../../domain/read-models/cliente-ficha.read-model';
import { ClienteFichaPresenter } from './cliente-ficha.presenter';

const FECHA = new Date('2026-11-01T06:00:00.000Z');

const detalle: ClienteDetalleReadModel = {
  id: 7,
  nombre: 'Ana',
  apellidos: null,
  telefono: null,
  direccion: null,
  dpi: null,
  observaciones: null,
  contactoReferenciaNombre: null,
  contactoReferenciaTelefono: null,
  estadoCliente: 'ACTIVO',
  estadoCobranza: 'AL_DIA',
  estadoServicioMikrotik: 'ACTIVO',
  contrasenaWifi: null,
  ssidRouter: null,
  fechaInstalacion: null,
  creadoEn: FECHA,
  actualizadoEn: FECHA,
  eliminadoEn: null,
  imagenes: [],
  asesor: null,
  servicio: null,
  municipio: null,
  departamento: null,
  sector: null,
  empresa: null,
  mikrotik: null,
  ip: null,
  ubicacion: null,
  facturacionZona: null,
  contratoServicioInternet: null,
  saldo: { saldoPendiente: 150, totalPagado: 300, ultimoPago: FECHA },
  tickets: [],
  facturas: [
    {
      id: 1,
      monto: 150,
      estado: 'PENDIENTE',
      periodo: '202611',
      fechaEmision: FECHA,
      fechaPagada: null,
      fechaVencimiento: FECHA,
      creador: null,
      pagos: [],
    },
  ],
  serviciosAdicionales: [],
};

describe('ClienteFichaPresenter.detalle', () => {
  it('conserva la forma que valida la app y entrega el saldo calculado', () => {
    const r = ClienteFichaPresenter.detalle(detalle);

    expect(r.apellidos).toBe('');
    expect(r.saldoCliente).toEqual({
      id: 7,
      saldo: 300,
      saldoPendiente: 150,
      totalPagos: 300,
      ultimoPago: '2026-11-01T06:00:00.000Z',
    });
    expect(r.facturaInternet[0]).toMatchObject({
      pagada: false,
      fechaEmision: '2026-11-01T06:00:00.000Z',
    });
    expect(r.servicioEstado).toBe(true);
  });

  it('no deja pasar campos que no declaró', () => {
    const r = ClienteFichaPresenter.detalle({
      ...detalle,
      asesor: { id: 1, nombre: 'Luis', contrasena: 'x' } as never,
    });

    expect(r.asesor).toStrictEqual({ id: 1, nombre: 'Luis' });
  });
});
