import { MediaKeyService } from './media-key.service';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

describe('MediaKeyService', () => {
  const servicio = new MediaKeyService();
  const fecha = new Date('2026-11-24T18:00:00Z');

  it('formato histórico: prefijo/empresa/cliente/carpeta del tipo/fecha/uuid.ext', () => {
    const key = servicio.generarKey({
      empresaId: 1,
      clienteId: 1001,
      tipo: 'IMAGEN',
      extension: '.webp',
      basePrefix: 'crm',
      fecha,
    });

    expect(key).toMatch(
      new RegExp(
        `^crm/empresas/1/clientes/1001/imagenes/2026/11/24/${UUID}\\.webp$`,
      ),
    );
  });

  it('con subfolder no agrega la carpeta del tipo y sanea los segmentos', () => {
    const key = servicio.generarKey({
      empresaId: 1,
      tipo: 'IMAGEN',
      extension: '.png',
      basePrefix: 'crm',
      subfolder: '/firmas/../tickets 62//conformidades/2/',
      fecha,
    });

    expect(key).toMatch(
      new RegExp(
        `^crm/empresas/1/firmas/tickets-62/conformidades/2/2026/11/24/${UUID}\\.png$`,
      ),
    );
  });

  it('el prefijo no puede escapar con .. ni barras', () => {
    const key = servicio.generarKey({
      empresaId: 2,
      extension: '.bin',
      basePrefix: '../../otro bucket/',
      fecha,
    });

    expect(key.startsWith('../')).toBe(false);
    expect(key).toContain('empresas/2/');
  });

  it('tipos desconocidos van a "otros"; sin tipo no hay carpeta', () => {
    expect(
      servicio.generarKey({
        empresaId: 1,
        tipo: 'perfil-avatar',
        extension: '.jpg',
        fecha,
      }),
    ).toMatch(/^empresas\/1\/otros\/2026\/11\/24\//);
    expect(
      servicio.generarKey({ empresaId: 1, extension: '.jpg', fecha }),
    ).toMatch(/^empresas\/1\/2026\/11\/24\//);
  });

  it('inferirExtension: MIME, luego nombre, luego .bin', () => {
    expect(servicio.inferirExtension('image/jpeg')).toBe('.jpeg');
    expect(servicio.inferirExtension('image/svg+xml')).toBe('.svg');
    expect(servicio.inferirExtension('/', 'foto.PNG')).toBe('.png');
    expect(servicio.inferirExtension('/')).toBe('.bin');
  });
});
