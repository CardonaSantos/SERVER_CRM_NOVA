import { Injectable } from '@nestjs/common';
import { Dayjs } from 'dayjs';

import { dayjs } from 'src/Utils/dayjs.config';

import {
  CredencialesPppoeGeneradas,
  GenerarCredencialesPppoeInput,
  PppoeCredentialGeneratorPort,
} from './pppoe-credential-generator.port';

@Injectable()
export class NovaPppoeCredentialGenerator
  implements PppoeCredentialGeneratorPort
{
  generate({
    clienteId,
    // accesoInternetId,
    fecha = new Date(),
  }: GenerarCredencialesPppoeInput): CredencialesPppoeGeneradas {
    this.assertPositiveId(clienteId, 'clienteId');

    // this.assertPositiveId(accesoInternetId, 'accesoInternetId');

    const fechaGuatemala = dayjs(fecha);

    if (!fechaGuatemala.isValid()) {
      throw new Error(
        'La fecha para generar las credenciales PPPoE no es válida.',
      );
    }

    return {
      usuario: this.buildUsername({
        clienteId,
        // accesoInternetId,
      }),

      secretoPlano: this.buildSecret(fechaGuatemala),

      generadoEn: fechaGuatemala.toDate(),
    };
  }

  private buildUsername(params: {
    clienteId: number;
    // accesoInternetId: number;
  }): string {
    return `${params.clienteId}`;
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
