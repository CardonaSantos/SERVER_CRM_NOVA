import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

import { esDomainError } from 'src/common/hexagonal/domain-error';

import { construirRespuestaError } from './respuesta-error';

const REQUEST_ID_VALIDO = /^[A-Za-z0-9._-]{8,64}$/;

/**
 * Filtro global de excepciones: contrato único de error (estándar §7.5).
 *
 * Toda respuesta de error HTTP sale como
 * { statusCode, codigo, message, campos?, requestId } + cabecera
 * X-Request-ID. La traducción vive en `construirRespuestaError`:
 *
 * - DomainError → status por tipo, su código y su mensaje.
 * - HttpException 4xx → mensaje deliberado (las frases genéricas de Nest se
 *   pasan a español), código declarado o genérico por status; validación
 *   con `campos`.
 * - 500 y errores no controlados → mensaje genérico; stack, método, ruta,
 *   usuario y requestId solo al log. Nunca stack, `details` ni el mensaje
 *   interno de throwFatalError.
 *
 * EXPONER_DETALLE_ERRORES=true agrega `detalle` a los 500 (solo local;
 * nunca en Railway).
 *
 * WebSocket: comportamiento estándar de Nest; un DomainError se emite como
 * { status: 'error', codigo, message }.
 */
@Catch()
export class FiltroGlobalExcepciones extends BaseExceptionFilter {
  private readonly logger = new Logger('Excepciones');

  private readonly exponerDetalle =
    process.env.EXPONER_DETALLE_ERRORES === 'true';

  private readonly filtroWs = new BaseWsExceptionFilter();

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() === 'ws') {
      return this.filtroWs.catch(
        esDomainError(exception)
          ? new WsException({
              status: 'error',
              codigo: exception.codigo,
              message: exception.message,
            })
          : exception,
        host,
      );
    }

    if (host.getType() !== 'http') {
      return super.catch(exception, host);
    }

    const http = host.switchToHttp();
    const request = http.getRequest<Request & { user?: { id?: number } }>();
    const response = http.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    const recibido = request.headers['x-request-id'];
    const requestId =
      typeof recibido === 'string' && REQUEST_ID_VALIDO.test(recibido)
        ? recibido
        : randomUUID();

    const resultado = construirRespuestaError(exception, requestId, {
      exponerDetalle: this.exponerDetalle,
    });

    if (resultado.registro) {
      const linea = `[${requestId}] ${request.method} ${request.route?.path ?? request.path} → ${resultado.status} ${resultado.cuerpo.codigo} (usuario ${request.user?.id ?? '-'}): ${resultado.mensajeInterno}`;

      if (resultado.registro === 'error') {
        this.logger.error(
          linea,
          exception instanceof Error ? exception.stack : undefined,
        );
      } else {
        this.logger.warn(linea);
      }
    }

    response.setHeader('X-Request-ID', requestId);
    response.status(resultado.status).json(resultado.cuerpo);
  }
}
