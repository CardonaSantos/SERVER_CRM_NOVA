import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
  ValidationError,
} from 'class-validator';

import { DomainError } from 'src/common/hexagonal/domain-error';
import {
  aplanarErroresValidacion,
  ErrorValidacionHttp,
} from 'src/common/validacion/error-validacion';

import { MENSAJE_ERROR_INTERNO, MENSAJE_VALIDACION } from './contrato-error';
import {
  camposDesdeMensajes,
  construirRespuestaError,
} from './respuesta-error';

const ID = 'req-12345678';

class CuentaEstadoInvalidoError extends DomainError {
  readonly codigo = 'CUENTA_PPPOE_ESTADO_INVALIDO';
  readonly tipo = 'CONFLICTO' as const;
  constructor() {
    super('No se puede suspender una cuenta que no está activa.');
  }
}

class RouterNoRespondeError extends DomainError {
  readonly codigo = 'ROUTER_NO_RESPONDE';
  readonly tipo = 'EXTERNO' as const;
  constructor(causa: unknown) {
    super('El router no respondió. Inténtalo más tarde.', { causa });
  }
}

class DireccionDto {
  @IsString()
  @IsNotEmpty()
  calle: string;
}

class CrearClienteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsInt()
  zonaId: number;

  @ValidateNested()
  @Type(() => DireccionDto)
  direccion: DireccionDto;
}

const pipeGlobal = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errores: ValidationError[]) =>
    new ErrorValidacionHttp(aplanarErroresValidacion(errores)),
});

describe('construirRespuestaError — contrato único de error', () => {
  it('DomainError: status por tipo, su código y su mensaje; no se registra', () => {
    const r = construirRespuestaError(new CuentaEstadoInvalidoError(), ID);

    expect(r.status).toBe(409);
    expect(r.cuerpo).toEqual({
      statusCode: 409,
      codigo: 'CUENTA_PPPOE_ESTADO_INVALIDO',
      message: 'No se puede suspender una cuenta que no está activa.',
      requestId: ID,
    });
    expect(r.registro).toBeNull();
  });

  it('DomainError EXTERNO: 502, se registra como warn con la causa, sin filtrarla', () => {
    const r = construirRespuestaError(
      new RouterNoRespondeError(new Error('ECONNREFUSED 10.0.0.1:22')),
      ID,
    );

    expect(r.status).toBe(502);
    expect(r.cuerpo.codigo).toBe('ROUTER_NO_RESPONDE');
    expect(r.registro).toBe('warn');
    expect(r.mensajeInterno).toContain('ECONNREFUSED');
    expect(JSON.stringify(r.cuerpo)).not.toContain('10.0.0.1');
  });

  it('validación del pipe global: VALIDACION con campos anidados y campos no permitidos', async () => {
    let capturado: unknown;

    try {
      await pipeGlobal.transform(
        { nombre: '', zonaId: 'x', direccion: { calle: '' }, extra: 1 },
        { type: 'body', metatype: CrearClienteDto, data: '' },
      );
    } catch (e) {
      capturado = e;
    }

    const r = construirRespuestaError(capturado, ID);

    expect(r.status).toBe(400);
    expect(r.cuerpo.codigo).toBe('VALIDACION');
    expect(r.cuerpo.message).toBe(MENSAJE_VALIDACION);

    const campos = Object.fromEntries(
      r.cuerpo.campos!.map((c) => [c.campo, c.mensajes]),
    );
    expect(Object.keys(campos).sort()).toEqual(
      ['direccion.calle', 'extra', 'nombre', 'zonaId'].sort(),
    );
    expect(campos.extra).toEqual(['Este campo no está permitido.']);
    // Nunca se devuelve el valor recibido.
    expect(JSON.stringify(r.cuerpo)).not.toContain('"x"');
  });

  it('ValidationPipe local (message en arreglo): VALIDACION con campos derivados', () => {
    const r = construirRespuestaError(
      new BadRequestException([
        'nombre should not be empty',
        'nombre must be a string',
        'property foo should not exist',
        'each value in estados must be one of the following values: A, B',
      ]),
      ID,
    );

    expect(r.cuerpo.codigo).toBe('VALIDACION');
    expect(typeof r.cuerpo.message).toBe('string');
    expect(r.cuerpo.campos!.map((c) => c.campo)).toEqual([
      'nombre',
      'foo',
      'estados',
    ]);
  });

  it('HttpException legacy con mensaje propio: lo conserva con código genérico', () => {
    const r = construirRespuestaError(
      new ConflictException({
        message:
          'Ya existe una factura para ese mes. No se permiten duplicados.',
      }),
      ID,
    );

    expect(r.cuerpo).toEqual({
      statusCode: 409,
      codigo: 'CONFLICTO',
      message: 'Ya existe una factura para ese mes. No se permiten duplicados.',
      requestId: ID,
    });
  });

  it('frases genéricas de Nest se pasan a español', () => {
    expect(
      construirRespuestaError(new UnauthorizedException(), ID).cuerpo,
    ).toMatchObject({
      codigo: 'NO_AUTENTICADO',
      message: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.',
    });
    expect(
      construirRespuestaError(new ForbiddenException('Forbidden resource'), ID)
        .cuerpo,
    ).toMatchObject({
      codigo: 'PROHIBIDO',
      message: 'No tiene permisos para esta operación.',
    });
    expect(
      construirRespuestaError(
        new NotFoundException('Cannot GET /no-existe'),
        ID,
      ).cuerpo,
    ).toMatchObject({
      codigo: 'NO_ENCONTRADO',
      message: 'El recurso solicitado no existe.',
    });
    expect(
      construirRespuestaError(
        new BadRequestException(
          'Validation failed (numeric string is expected)',
        ),
        ID,
      ).cuerpo,
    ).toMatchObject({
      codigo: 'SOLICITUD_INVALIDA',
      message: 'La solicitud no es válida.',
    });
    expect(
      construirRespuestaError(
        new HttpException('ThrottlerException: Too Many Requests', 429),
        ID,
      ).cuerpo,
    ).toMatchObject({ codigo: 'DEMASIADOS_INTENTOS' });
  });

  it('410 de endpoint retirado y mensajes de auth existentes', () => {
    expect(
      construirRespuestaError(
        new GoneException('Este endpoint fue retirado.'),
        ID,
      ).cuerpo,
    ).toMatchObject({
      codigo: 'ENDPOINT_RETIRADO',
      message: 'Este endpoint fue retirado.',
    });
    expect(
      construirRespuestaError(
        new UnauthorizedException('La sesión expiró o fue revocada.'),
        ID,
      ).cuerpo.message,
    ).toBe('La sesión expiró o fue revocada.');
  });

  it('legacy con el mensaje en `error` (Banrural) y errorCode propio', () => {
    const r = construirRespuestaError(
      new BadRequestException({
        success: 0,
        status: 400,
        error: 'Se requiere clienteId o codigoUnico',
      }),
      ID,
    );
    expect(r.cuerpo).toEqual({
      statusCode: 400,
      codigo: 'SOLICITUD_INVALIDA',
      message: 'Se requiere clienteId o codigoUnico',
      requestId: ID,
    });

    const conCodigo = construirRespuestaError(
      new NotFoundException({
        message: 'No existe',
        errorCode: 'FACTURA_NO_ENCONTRADA',
      }),
      ID,
    );
    expect(conCodigo.cuerpo.codigo).toBe('FACTURA_NO_ENCONTRADA');

    const prisma = construirRespuestaError(
      new NotFoundException({
        message: 'No existe',
        errorCode: 'PRISMA_RECORD_NOT_FOUND',
      }),
      ID,
    );
    expect(prisma.cuerpo.codigo).toBe('NO_ENCONTRADO');
  });

  it('error no controlado: 500 genérico, se registra, sin filtrar el mensaje real', () => {
    const r = construirRespuestaError(
      new Error('relation "Factura" does not exist'),
      ID,
    );

    expect(r.status).toBe(500);
    expect(r.cuerpo).toEqual({
      statusCode: 500,
      codigo: 'ERROR_INTERNO',
      message: MENSAJE_ERROR_INTERNO,
      requestId: ID,
    });
    expect(r.registro).toBe('error');
    expect(r.mensajeInterno).toContain('relation');
  });

  it('500 de throwFatalError: oculta el mensaje interno y los details', () => {
    const r = construirRespuestaError(
      new InternalServerErrorException({
        statusCode: 500,
        message: '[auth-login] detalle interno',
        errorCode: 'INTERNAL_SERVER_ERROR',
        details: { stack: 'at x' },
      }),
      ID,
    );

    expect(r.cuerpo.message).toBe(MENSAJE_ERROR_INTERNO);
    expect(r.cuerpo.codigo).toBe('ERROR_INTERNO');
    expect(JSON.stringify(r.cuerpo)).not.toContain('detalle interno');
  });

  it('500 deliberado conserva su mensaje; detalle solo con exponerDetalle', () => {
    const r = construirRespuestaError(
      new InternalServerErrorException('No se pudo generar el reporte.'),
      ID,
    );
    expect(r.cuerpo.message).toBe('No se pudo generar el reporte.');
    expect(r.cuerpo.detalle).toBeUndefined();

    const local = construirRespuestaError(new Error('x'), ID, {
      exponerDetalle: true,
    });
    expect(local.cuerpo.detalle).toBeDefined();
  });

  it('5xx deliberado (no 500): conserva el mensaje y se registra como warn', () => {
    const r = construirRespuestaError(
      new ServiceUnavailableException('El router no está disponible.'),
      ID,
    );

    expect(r.status).toBe(503);
    expect(r.cuerpo.codigo).toBe('SERVICIO_NO_DISPONIBLE');
    expect(r.cuerpo.message).toBe('El router no está disponible.');
    expect(r.registro).toBe('warn');
  });

  it('errores http-errors expuestos (body-parser) conservan su status 4xx', () => {
    const error = Object.assign(new Error('request entity too large'), {
      status: 413,
      expose: true,
    });

    const r = construirRespuestaError(error, ID);

    expect(r.status).toBe(413);
    expect(r.cuerpo.codigo).toBe('CARGA_DEMASIADO_GRANDE');
  });

  it('camposDesdeMensajes agrupa por campo', () => {
    expect(
      camposDesdeMensajes(['a must be x', 'a must be y', 'b must be z']),
    ).toEqual([
      { campo: 'a', mensajes: ['a must be x', 'a must be y'] },
      { campo: 'b', mensajes: ['b must be z'] },
    ]);
  });
});
