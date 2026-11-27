import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { ActualizarClienteDto } from './actualizar-cliente.dto';
import { CrearClienteDto } from './crear-cliente.dto';

type Dto = typeof CrearClienteDto | typeof ActualizarClienteDto;

const validar = (metatype: Dto, body: unknown) =>
  new ValidacionGlobalPipe().transform(body, { type: 'body', metatype });

/** Un formulario con campos sin llenar (datos ficticios). */
const alta = {
  nombre: 'Ana',
  apellidos: 'Pérez',
  ip: '10.0.0.2',
  telefono: '55555555',
  dpi: '',
  fechaInstalacion: '2026-11-01T06:00:00.000Z',
  zonaFacturacionId: 2,
  servicioWifiId: 3,
  municipioId: 1,
  departamentoId: 1,
  sectorId: null,
  coordenadas: [] as string[],
  servicesIds: [] as number[],
  idContrato: '',
  fechaFirma: '',
  estado: 'ACTIVO',
};

describe('DTO de alta y edición de cliente', () => {
  it('acepta el alta con campos vacíos o sin elegir', async () => {
    const dto = await validar(CrearClienteDto, alta);

    expect(dto.fechaInstalacion).toBeInstanceOf(Date);
    expect(dto.fechaFirma).toBeUndefined();
  });

  it.each([
    'nombre',
    'ip',
    'zonaFacturacionId',
    'servicioWifiId',
    'municipioId',
    'departamentoId',
    'servicesIds',
  ])('el alta exige %s', async (campo) => {
    await expect(
      validar(CrearClienteDto, { ...alta, [campo]: undefined }),
    ).rejects.toBeDefined();
  });

  it('el alta no admite un estado que no sea de alta', async () => {
    await expect(
      validar(CrearClienteDto, { ...alta, estado: 'DESINSTALADO' }),
    ).rejects.toBeDefined();
  });

  it('la edición solo exige el nombre', async () => {
    const dto = await validar(ActualizarClienteDto, {
      nombre: 'Ana',
      mikrotikRouterId: null,
      fechaInstalacion: '2026-11-01T06:00:00.000Z',
    });

    expect(dto).toMatchObject({ nombre: 'Ana', mikrotikRouterId: null });
    expect((dto as ActualizarClienteDto).fechaInstalacion).toBeInstanceOf(Date);
  });

  it.each([
    ['cobranza', { estadoCobranza: 'AL_DIA' }],
    ['IP (tiene su propia ruta)', { ip: '10.0.0.3' }],
    ['empresa', { empresaId: 2 }],
    ['estado inventado', { estado: 'OTRO' }],
  ])('la edición rechaza %s', async (_caso, extra) => {
    await expect(
      validar(ActualizarClienteDto, { nombre: 'Ana', ...extra }),
    ).rejects.toBeDefined();
  });
});
