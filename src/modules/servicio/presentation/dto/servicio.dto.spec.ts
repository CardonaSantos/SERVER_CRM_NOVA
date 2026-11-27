import { Type } from '@nestjs/common';
import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { ActualizarPlanInternetDto } from './actualizar-plan-internet.dto';
import { ActualizarServicioAdicionalDto } from './actualizar-servicio-adicional.dto';
import { CambiarPrecioPlanInternetDto } from './cambiar-precio-plan-internet.dto';
import { CrearPlanInternetDto } from './crear-plan-internet.dto';
import { CrearServicioAdicionalDto } from './crear-servicio-adicional.dto';
import { CrearTipoServicioDto } from './crear-tipo-servicio.dto';
import { ListarPlanesInternetQueryDto } from './listar-planes-internet-query.dto';

describe('DTO de planes y servicios', () => {
  const pipe = new ValidacionGlobalPipe();
  const validar = (metatype: Type, body: object) =>
    pipe.transform(body, { type: 'body', metatype });
  const plan = { nombre: 'Hogar', precio: 150 };

  it('acepta las altas mínimas y completas', async () => {
    await expect(validar(CrearPlanInternetDto, plan)).resolves.toBeTruthy();
    await expect(
      validar(CrearPlanInternetDto, { ...plan, velocidad: '20', precio: 0 }),
    ).resolves.toBeTruthy();
    await expect(
      validar(CrearServicioAdicionalDto, plan),
    ).resolves.toBeTruthy();
    await expect(
      validar(CrearTipoServicioDto, { nombre: 'Equipo' }),
    ).resolves.toBeTruthy();
  });

  it.each(['empresaId', 'estado'])('el alta ya no admite %s', async (campo) => {
    await expect(
      validar(CrearPlanInternetDto, { ...plan, [campo]: 1 }),
    ).rejects.toThrow();
    await expect(
      validar(CrearServicioAdicionalDto, { ...plan, [campo]: 1 }),
    ).rejects.toThrow();
  });

  it.each([
    { precio: -1 },
    { precio: 10.005 },
    { precio: '150' },
    { nombre: '  ' },
  ])('rechaza %j', async (cambio) => {
    await expect(
      validar(CrearPlanInternetDto, { ...plan, ...cambio }),
    ).rejects.toThrow();
  });

  it('la edición del plan no admite el precio', async () => {
    await expect(
      validar(ActualizarPlanInternetDto, { precio: 10 }),
    ).rejects.toThrow();
  });

  it('la edición admite cuerpos parciales y quitar valores con null', async () => {
    await expect(
      validar(ActualizarPlanInternetDto, { velocidad: null }),
    ).resolves.toBeTruthy();
    await expect(
      validar(ActualizarServicioAdicionalDto, {
        descripcion: null,
        tipoServicioId: null,
      }),
    ).resolves.toBeTruthy();
  });

  it.each(['nombre', 'estado', 'precio'])(
    'la edición no admite null en %s',
    async (campo) => {
      await expect(
        validar(ActualizarServicioAdicionalDto, { [campo]: null }),
      ).rejects.toThrow();
    },
  );

  it('cambiar el precio exige el precio y la contraseña', async () => {
    await expect(
      validar(CambiarPrecioPlanInternetDto, {
        precio: 175,
        contrasenaActual: 'x',
      }),
    ).resolves.toBeTruthy();
    await expect(
      validar(CambiarPrecioPlanInternetDto, { precio: 175 }),
    ).rejects.toThrow();
    await expect(
      validar(CambiarPrecioPlanInternetDto, { contrasenaActual: 'x' }),
    ).rejects.toThrow();
  });

  it('los filtros del listado aceptan uno o varios estados', async () => {
    const consultar = (query: object) =>
      pipe.transform(query, {
        type: 'query',
        metatype: ListarPlanesInternetQueryDto,
      });

    await expect(
      consultar({ estados: 'ACTIVO', page: '2', sortBy: 'precio' }),
    ).resolves.toMatchObject({ estados: ['ACTIVO'], page: 2 });
    await expect(consultar({ estados: 'OTRO' })).rejects.toThrow();
  });
});
