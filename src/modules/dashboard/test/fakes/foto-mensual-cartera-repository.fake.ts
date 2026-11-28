import { FotoMensualCarteraEntity } from '../../domain/entities/foto-mensual-cartera.entity';
import { FotoMensualCarteraRepositoryPort } from '../../domain/ports/foto-mensual-cartera-repository.port';
import { FotoMensualCarteraProps } from '../../domain/props/foto-mensual-cartera.props';

export class FotoMensualCarteraRepositoryFake
  implements FotoMensualCarteraRepositoryPort
{
  readonly fotos = new Map<string, FotoMensualCarteraProps>();
  private siguienteId = 1;

  guardarSiNoExiste(foto: FotoMensualCarteraEntity): Promise<boolean> {
    if (this.fotos.has(foto.mes)) return Promise.resolve(false);
    this.fotos.set(foto.mes, {
      ...foto.toPrimitives(),
      id: this.siguienteId++,
    });
    return Promise.resolve(true);
  }
}
