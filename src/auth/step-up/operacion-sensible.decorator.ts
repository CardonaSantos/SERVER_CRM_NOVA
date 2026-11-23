import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';

import { LimitarIntentosReautenticacion } from '../throttling/auth-throttling';
import { CAMPO_CONTRASENA, StepUpInterceptor } from './step-up.interceptor';

/**
 * Operación sensible (cortes, reactivaciones, bajas, provisionamiento,
 * autorizaciones PPPoE...):
 * - límite de intentos de reautenticación (10/min por usuario);
 * - step-up (D8): con un token de POST /auth/reautenticar de hace ≤ 5 min
 *   no hace falta enviar la contraseña; sin él, se exige en el body como
 *   hasta ahora (transición de camino doble).
 *
 * `campoContrasena`: nombre del campo del body (por omisión
 * 'contrasenaActual').
 */
export function OperacionSensible(opciones: { campoContrasena?: string } = {}) {
  return applyDecorators(
    LimitarIntentosReautenticacion(),
    SetMetadata(
      CAMPO_CONTRASENA,
      opciones.campoContrasena ?? 'contrasenaActual',
    ),
    UseInterceptors(StepUpInterceptor),
  );
}
