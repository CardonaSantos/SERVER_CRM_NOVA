import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';

import { CreateClienteInternetDto } from './create-cliente-internet.dto';
import { UpdateClienteInternetDto } from './update-cliente-internet.dto';

type Dto = typeof CreateClienteInternetDto | typeof UpdateClienteInternetDto;

const validar = (metatype: Dto, body: unknown) =>
  new ValidacionGlobalPipe().transform(body, { type: 'body', metatype });

/** Campos que envían los dos formularios del front React (datos ficticios). */
const comunes = {
  nombre: 'Ana',
  apellidos: 'Pérez',
  ip: '10.0.0.2',
  // El formulario no exige código de país.
  telefono: '55555555',
  direccion: 'Zona 1',
  dpi: '',
  observaciones: '',
  contactoReferenciaNombre: '',
  contactoReferenciaTelefono: '',
  contrasenaWifi: '',
  ssidRouter: '',
  // JSON entrega las fechas como texto.
  fechaInstalacion: '2026-11-01T06:00:00.000Z',
  municipioId: 1,
  departamentoId: 1,
  sectorId: null,
  empresaId: 1,
  coordenadas: [] as string[],
  servicesIds: [] as number[],
  servicioWifiId: 3,
  zonaFacturacionId: 2,
  idContrato: '',
  fechaFirma: '2026-11-01T06:00:00.000Z',
  archivoContrato: '',
  observacionesContrato: '',
  estado: 'ACTIVO',
};

const alta = {
  ...comunes,
  userId: 4,
  mkSelected: null,
  activateOnMk: false,
};

const edicion = {
  ...comunes,
  id: 25,
  gateway: '',
  mascara: '',
  estadoCobranza: 'AL_DIA',
  enviarRecordatorio: true,
  mikrotikRouterId: null,
};

describe('Alta y edición de cliente con el pipe estricto', () => {
  it('acepta el alta tal como la envía el front', async () => {
    const dto = await validar(CreateClienteInternetDto, alta);

    expect(dto).toMatchObject({ nombre: 'Ana', servicioWifiId: 3 });
    expect(dto.fechaInstalacion).toBeInstanceOf(Date);
  });

  it('acepta la edición tal como la envía el front', async () => {
    const dto = await validar(UpdateClienteInternetDto, edicion);

    expect(dto).toMatchObject({ nombre: 'Ana', estadoCobranza: 'AL_DIA' });
  });

  it('acepta servicios adicionales y campos sin elegir', async () => {
    await expect(
      validar(CreateClienteInternetDto, {
        ...alta,
        servicesIds: [4, 5],
        fechaInstalacion: null,
        fechaFirma: null,
      }),
    ).resolves.toBeDefined();

    await expect(
      validar(UpdateClienteInternetDto, {
        ...edicion,
        municipioId: null,
        departamentoId: null,
        servicioWifiId: null,
        zonaFacturacionId: null,
      }),
    ).resolves.toBeDefined();
  });

  it.each([
    'nombre',
    'servicioWifiId',
    'zonaFacturacionId',
    'municipioId',
    'departamentoId',
    'empresaId',
    'servicesIds',
  ])('el alta exige %s', async (campo) => {
    await expect(
      validar(CreateClienteInternetDto, { ...alta, [campo]: undefined }),
    ).rejects.toBeDefined();
  });

  it('sigue rechazando estados inventados y campos desconocidos', async () => {
    await expect(
      validar(UpdateClienteInternetDto, { ...edicion, estado: 'OTRO' }),
    ).rejects.toBeDefined();
    await expect(
      validar(CreateClienteInternetDto, { ...alta, rol: 'ADMIN' }),
    ).rejects.toBeDefined();
  });
});
