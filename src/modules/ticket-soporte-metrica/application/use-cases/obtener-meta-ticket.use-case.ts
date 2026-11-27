import { Injectable } from '@nestjs/common';
import { MetaTicketConAvance } from '../../domain/read-models/meta-ticket.read-model';
import { AvanceMetasService } from '../services/avance-metas.service';

@Injectable()
export class ObtenerMetaTicketUseCase {
  constructor(private readonly avance: AvanceMetasService) {}

  execute(input: { metaId: number }): Promise<MetaTicketConAvance> {
    return this.avance.detalle(input.metaId);
  }
}
