import {
  AlmacenamientoMediaFacadePort,
  SubirMediaInput,
  SubirMediaResult,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.facade.port';

export class AlmacenamientoMediaFake
  implements Partial<AlmacenamientoMediaFacadePort>
{
  readonly subidas: SubirMediaInput[] = [];

  subirMedia(input: SubirMediaInput): Promise<SubirMediaResult> {
    this.subidas.push(input);

    return Promise.resolve({
      id: 40 + this.subidas.length,
      bucket: 'bucket',
      key: `crm/instalaciones/${this.subidas.length}`,
      tipo: input.tipo,
    });
  }
}
