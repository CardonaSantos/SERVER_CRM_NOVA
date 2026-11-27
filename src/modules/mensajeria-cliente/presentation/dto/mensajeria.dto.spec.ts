import { Type } from '@nestjs/common';
import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { AvisarMensajeBotDto } from './avisar-mensaje-bot.dto';
import { CrearPlantillaImagenDto } from './crear-plantilla-imagen.dto';
import { CrearPlantillaDto } from './crear-plantilla.dto';
import { EnviarCampaniaDto } from './enviar-campania.dto';
import { ListarPlantillasQueryDto } from './listar-plantillas-query.dto';

describe('DTO de mensajería', () => {
  const pipe = new ValidacionGlobalPipe();
  const validar = (metatype: Type, valor: object, type = 'body' as const) =>
    pipe.transform(valor, { type, metatype });

  it('acepta la plantilla que arma la web', async () => {
    await expect(
      validar(CrearPlantillaDto, {
        name: 'aviso',
        language: 'es',
        category: 'UTILITY',
        components: [
          { type: 'HEADER', format: 'TEXT', text: 'Aviso' },
          {
            type: 'BODY',
            text: 'Hola {{1}}',
            example: { body_text: [['Ana']] },
          },
          {
            type: 'BUTTONS',
            buttons: [{ type: 'QUICK_REPLY', text: 'Ok' }],
          },
        ],
      }),
    ).resolves.toBeTruthy();
    await expect(
      validar(CrearPlantillaImagenDto, {
        name: 'aviso',
        language: 'es',
        headerHandle: 'h',
        bodyText: 'Hola',
        bodyExample: [[]],
      }),
    ).resolves.toBeTruthy();
  });

  it('convierte el límite del listado', async () => {
    await expect(
      pipe.transform(
        { status: 'APPROVED', limit: '20' },
        { type: 'query', metatype: ListarPlantillasQueryDto },
      ),
    ).resolves.toMatchObject({ limit: 20 });
  });

  const campania = { plantilla: 'aviso', idioma: 'es', clienteIds: [1, 2] };

  it('acepta la campaña por ids', async () => {
    await expect(validar(EnviarCampaniaDto, campania)).resolves.toBeTruthy();
  });

  it.each([
    { clienteIds: [] },
    { clienteIds: ['1'] },
    { imagenUrl: 'http://x.test/a.png' },
    { recipients: [] },
  ])('la campaña no admite %p', async (cambio) => {
    await expect(
      validar(EnviarCampaniaDto, { ...campania, ...cambio }),
    ).rejects.toThrow();
  });

  it('el aviso del bot exige el wamid y nada más', async () => {
    await expect(
      validar(AvisarMensajeBotDto, { wamid: 'wamid.ABC' }),
    ).resolves.toBeTruthy();
    await expect(validar(AvisarMensajeBotDto, {})).rejects.toThrow();
    await expect(
      validar(AvisarMensajeBotDto, { event: 'x', data: { wamid: 'w' } }),
    ).rejects.toThrow();
  });
});
