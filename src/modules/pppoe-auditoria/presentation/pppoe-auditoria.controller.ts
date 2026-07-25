import {
  Controller,
  Get,
  Logger,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PppoeAuditoriaService } from '../application/services/pppoe-auditoria.service';
import { ListarPppoeAuditoriasQueryDto } from '../application/dto/listar-pppoe-auditorias-query.dto';
import { PppoeAuditoriaPresenter } from './pppoe-auditoria-presenter.presenter';

@Controller('pppoe-auditoria')
export class PppoeAuditoriaController {
  private logger = new Logger(PppoeAuditoriaController.name);
  constructor(private readonly pppoeAuditoriaService: PppoeAuditoriaService) {}

  /**
   * Listado administrativo paginado y enriquecido
   * de eventos de auditoría PPPoE.
   */
  @Get()
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    query: ListarPppoeAuditoriasQueryDto,
  ) {
    this.logger.log(`Query:\n${JSON.stringify(query, null, 2)}`);

    const result = await this.pppoeAuditoriaService.findAll(query);

    return PppoeAuditoriaPresenter.paginatedToHttp(result);
  }
}
