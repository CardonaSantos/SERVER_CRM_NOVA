import { Inject, Injectable } from '@nestjs/common';
import { Dayjs } from 'dayjs';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { dayjs } from 'src/Utils/dayjs.config';

import {
  CredencialesPppoeGeneradas,
  GenerarCredencialesPppoeInput,
  PppoeCredentialGeneratorPort,
} from '../../public/pppoe-credential-generator.port';

/**
 * Esquema "Nova" de credenciales PPPoE:
 * - usuario: el id del cliente;
 * - contraseña: `NV-YYYY/MM/DDMHHH:mm#` del instante de generación.
 *
 * Nota (sin cambiar, decisión del dueño pendiente): la contraseña se
 * deduce de la fecha y hora al minuto, y `dayjs(fecha)` la formatea en la
 * zona horaria del proceso, no en America/Guatemala.
 */
@Injectable()
export class PppoeCredentialGeneratorNovaAdapter
  implements PppoeCredentialGeneratorPort
{
  constructor(@Inject(RELOJ) private readonly reloj: RelojPort) {}

  generate({
    clienteId,
    fecha,
  }: GenerarCredencialesPppoeInput): CredencialesPppoeGeneradas {
    this.assertPositiveId(clienteId, 'clienteId');

    const instante = dayjs(fecha ?? this.reloj.ahora());

    if (!instante.isValid()) {
      throw new Error(
        'La fecha para generar las credenciales PPPoE no es válida.',
      );
    }

    return {
      usuario: `${clienteId}`,

      secretoPlano: this.buildSecret(instante),

      generadoEn: instante.toDate(),
    };
  }

  private buildSecret(fecha: Dayjs): string {
    return `NV-${fecha.format('YYYY/MM/DD[MH]HH:mm[#]')}`;
  }

  private assertPositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }
}
