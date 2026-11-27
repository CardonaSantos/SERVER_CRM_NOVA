import { EstadoCampania } from '../enums/campania.enum';
import { CampaniaNoReanudableError } from '../errors/mensajeria-cliente.errors';
import { estadoVigente } from '../policies/campania.policy';
import { CampaniaEntity } from './campania.entity';

describe('CampaniaEntity', () => {
  const inicio = new Date('2026-11-26T16:00:00.000Z');
  const despues = new Date('2026-11-26T16:06:00.000Z');
  const nueva = () =>
    CampaniaEntity.create(
      { plantilla: 'aviso', idioma: 'es', imagenUrl: null, creadoPorId: 1 },
      inicio,
    );

  it('nace en curso y se considera interrumpida si deja de avanzar', () => {
    const props = nueva().toPrimitives();

    expect(estadoVigente(props, inicio)).toBe(EstadoCampania.EN_CURSO);
    expect(estadoVigente(props, despues)).toBe(EstadoCampania.INTERRUMPIDA);
  });

  it('solo se reanuda si está detenida', () => {
    const campania = nueva();
    expect(() => campania.reanudar(inicio)).toThrow(CampaniaNoReanudableError);

    campania.reanudar(despues);

    expect(campania.toPrimitives()).toMatchObject({
      estado: EstadoCampania.EN_CURSO,
      actividadEn: despues,
    });
  });

  it('una completada no se reanuda', () => {
    const campania = CampaniaEntity.hydrate({
      ...nueva().toPrimitives(),
      estado: EstadoCampania.COMPLETADA,
    });

    expect(() => campania.reanudar(despues)).toThrow(CampaniaNoReanudableError);
  });
});
