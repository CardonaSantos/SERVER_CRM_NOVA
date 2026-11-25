import { ValidationPipe } from '@nestjs/common';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import {
  ComoArreglo,
  ComoBooleano,
} from 'src/common/http/transformaciones-query';

import {
  aDesplazamiento,
  calcularTotalPaginas,
  crearResultadoPaginado,
  normalizarPaginacion,
  presentarPaginado,
} from './paginacion';

enum Estado {
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
}

class ListarPruebaQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @ComoArreglo()
  @IsEnum(Estado, { each: true })
  estados?: Estado[];

  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  activo?: boolean;
}

const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

const validar = (query: Record<string, unknown>) =>
  pipe.transform(query, {
    type: 'query',
    metatype: ListarPruebaQueryDto,
    data: '',
  }) as Promise<ListarPruebaQueryDto>;

describe('paginación común', () => {
  it('normalizarPaginacion aplica valores por defecto y el máximo', () => {
    expect(normalizarPaginacion({})).toEqual({ page: 1, limit: 10 });
    expect(normalizarPaginacion({ page: 3, limit: 500 })).toEqual({
      page: 3,
      limit: 100,
    });
    expect(normalizarPaginacion({ page: 0, limit: -5 })).toEqual({
      page: 1,
      limit: 10,
    });
    expect(normalizarPaginacion({ page: 1.5, limit: null })).toEqual({
      page: 1,
      limit: 10,
    });
    expect(
      normalizarPaginacion({}, { limitePorDefecto: 25, limiteMaximo: 20 }),
    ).toEqual({ page: 1, limit: 20 });
  });

  it('aDesplazamiento y calcularTotalPaginas', () => {
    expect(aDesplazamiento({ page: 3, limit: 20 })).toEqual({
      skip: 40,
      take: 20,
    });
    expect(calcularTotalPaginas(0, 10)).toBe(0);
    expect(calcularTotalPaginas(95, 10)).toBe(10);
    expect(calcularTotalPaginas(100, 10)).toBe(10);
  });

  it('presentarPaginado produce el contrato HTTP { data, meta }', () => {
    const resultado = crearResultadoPaginado([{ id: 1, interno: 'x' }], 21, {
      page: 2,
      limit: 10,
    });

    expect(presentarPaginado(resultado, (i) => ({ id: i.id }))).toEqual({
      data: [{ id: 1 }],
      meta: { total: 21, page: 2, limit: 10, totalPages: 3 },
    });
  });

  it('PaginacionQueryDto convierte números de query explícitamente', async () => {
    const dto = await validar({
      page: '2',
      limit: '50',
      search: '  juan  ',
      sortDir: 'desc',
    });

    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
    expect(dto.search).toBe('juan');
    expect(dto.sortDir).toBe('desc');
  });

  it('PaginacionQueryDto rechaza límites y direcciones inválidas', async () => {
    await expect(validar({ limit: '101' })).rejects.toBeDefined();
    await expect(validar({ page: '0' })).rejects.toBeDefined();
    await expect(validar({ page: 'abc' })).rejects.toBeDefined();
    await expect(validar({ sortDir: 'arriba' })).rejects.toBeDefined();
    await expect(validar({ otro: '1' })).rejects.toBeDefined();
  });

  it('ComoArreglo acepta valor único, repetido y separado por comas', async () => {
    expect((await validar({ estados: 'ACTIVO' })).estados).toEqual(['ACTIVO']);
    expect(
      (await validar({ estados: ['ACTIVO', 'SUSPENDIDO'] })).estados,
    ).toEqual(['ACTIVO', 'SUSPENDIDO']);
    expect((await validar({ estados: 'ACTIVO,SUSPENDIDO' })).estados).toEqual([
      'ACTIVO',
      'SUSPENDIDO',
    ]);
    await expect(validar({ estados: 'OTRO' })).rejects.toBeDefined();
  });

  it('ComoBooleano no adivina: solo true/false/1/0', async () => {
    expect((await validar({ activo: 'true' })).activo).toBe(true);
    expect((await validar({ activo: 'false' })).activo).toBe(false);
    expect((await validar({ activo: '0' })).activo).toBe(false);
    await expect(validar({ activo: 'si' })).rejects.toBeDefined();
  });

  it('search vacío queda como undefined', async () => {
    expect((await validar({ search: '   ' })).search).toBeUndefined();
  });
});
