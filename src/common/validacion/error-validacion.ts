import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

import {
  CampoConError,
  CODIGO_VALIDACION,
  MENSAJE_VALIDACION,
} from 'src/common/excepciones/contrato-error';

const MENSAJE_CAMPO_NO_PERMITIDO = 'Este campo no está permitido.';

/**
 * 400 del ValidationPipe global con los errores agrupados por campo.
 * El filtro global lo convierte en { codigo: 'VALIDACION', message, campos }.
 */
export class ErrorValidacionHttp extends BadRequestException {
  constructor(readonly campos: CampoConError[]) {
    super({ codigo: CODIGO_VALIDACION, message: MENSAJE_VALIDACION, campos });
  }
}

/**
 * Aplana el árbol de class-validator a `campo → mensajes`, con rutas
 * anidadas (`direccion.calle`, `items.0.cantidad`). Nunca incluye el
 * valor recibido.
 */
export function aplanarErroresValidacion(
  errores: ValidationError[],
  prefijo = '',
): CampoConError[] {
  const resultado: CampoConError[] = [];

  for (const error of errores) {
    const campo = prefijo ? `${prefijo}.${error.property}` : error.property;
    const restricciones = error.constraints ?? {};

    const mensajes = Object.entries(restricciones).map(([regla, mensaje]) =>
      regla === 'whitelistValidation' ? MENSAJE_CAMPO_NO_PERMITIDO : mensaje,
    );

    if (mensajes.length > 0) {
      resultado.push({ campo, mensajes });
    }

    if (error.children?.length) {
      resultado.push(...aplanarErroresValidacion(error.children, campo));
    }
  }

  return resultado;
}
