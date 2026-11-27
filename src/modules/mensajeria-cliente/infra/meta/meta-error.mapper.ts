import { AxiosError } from 'axios';
import { DomainError } from 'src/common/hexagonal/domain-error';
import {
  MensajeriaProveedorNoDisponibleError,
  MensajeriaProveedorRechazoError,
  MensajeriaSinConfirmacionError,
} from '../../domain/errors/mensajeria-cliente.errors';

/** Códigos de Meta que afectan a toda la cuenta: token o límites de envío. */
const CODIGOS_DE_CUENTA = [4, 190, 80007, 130429, 131048];

/** La petición ni siquiera salió del servidor. */
const SIN_CONEXION = ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'];

export type CuerpoErrorMeta = {
  error?: { code?: number; error_user_msg?: string };
};

/**
 * Traduce un fallo de Graph API. El texto técnico de Meta no llega al usuario;
 * solo el que Meta escribe para él (`error_user_msg`) y el código.
 */
export function traducirErrorMeta(error: unknown): DomainError {
  const fallo = error as AxiosError<CuerpoErrorMeta>;
  const status = fallo?.response?.status;

  if (!status) {
    return SIN_CONEXION.includes(fallo?.code ?? '')
      ? new MensajeriaProveedorNoDisponibleError()
      : new MensajeriaSinConfirmacionError();
  }

  const meta = fallo.response?.data?.error;
  if (
    [401, 403, 429].includes(status) ||
    CODIGOS_DE_CUENTA.includes(meta?.code ?? -1)
  ) {
    return new MensajeriaProveedorNoDisponibleError();
  }
  if (status >= 500) return new MensajeriaSinConfirmacionError();

  const codigo = meta?.code ? ` (código ${meta.code})` : '';
  return new MensajeriaProveedorRechazoError(
    meta?.error_user_msg ?? `WhatsApp rechazó la solicitud${codigo}.`,
  );
}
