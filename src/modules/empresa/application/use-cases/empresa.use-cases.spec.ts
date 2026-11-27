import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EmpresaNoConfiguradaError } from '../../domain/errors/empresa.errors';
import { EmpresaRepositoryFake } from '../../test/fakes/empresa.fake';
import { ActualizarEmpresaUseCase } from './actualizar-empresa.use-case';
import { ObtenerEmpresaUseCase } from './obtener-empresa.use-case';

function armar() {
  const empresas = new EmpresaRepositoryFake();
  const reloj = new RelojFijo('2026-07-01T12:00:00.000Z');

  return {
    empresas,
    obtener: new ObtenerEmpresaUseCase(empresas),
    actualizar: new ActualizarEmpresaUseCase(empresas, reloj),
  };
}

describe('empresa', () => {
  it('devuelve la empresa de la sesión y guarda sus cambios', async () => {
    const t = armar();

    await t.actualizar.execute({ empresaId: 1, cambios: { nit: '123' } });

    await expect(t.obtener.execute({ empresaId: 1 })).resolves.toMatchObject({
      nombre: 'Empresa Demo',
      nit: '123',
      actualizadoEn: new Date('2026-07-01T12:00:00.000Z'),
    });
  });

  it('sin empresa responde que no está configurada y no crea ninguna', async () => {
    const t = armar();
    t.empresas.guardada = null;

    await expect(t.obtener.execute({ empresaId: 1 })).rejects.toThrow(
      EmpresaNoConfiguradaError,
    );
    await expect(
      t.actualizar.execute({ empresaId: 1, cambios: { nombre: 'X' } }),
    ).rejects.toThrow(EmpresaNoConfiguradaError);
    expect(t.empresas.guardada).toBeNull();
  });
});
