import { Injectable } from '@nestjs/common';
import { dayjs } from 'src/Utils/dayjs.config';
import { Dayjs } from 'dayjs';

import {
  CredencialesPppoeGeneradas,
  GenerarCredencialesPppoeInput,
  PppoeCredentialGeneratorPort,
} from '../../application/ports/pppoe-credential-generator.port';

@Injectable()
export class NovaPppoeCredentialGenerator
  implements PppoeCredentialGeneratorPort
{
  generate({
    clienteId,
    fecha = new Date(),
  }: GenerarCredencialesPppoeInput): CredencialesPppoeGeneradas {
    this.assertPositiveId(clienteId, 'clienteId');

    const fechaGuatemala = dayjs(fecha);

    if (!fechaGuatemala.isValid()) {
      throw new Error(
        'La fecha para generar las credenciales PPPoE no es válida.',
      );
    }

    return {
      usuario: String(clienteId),

      secretoPlano: this.buildSecret(fechaGuatemala),

      generadoEn: fechaGuatemala.toDate(),
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
