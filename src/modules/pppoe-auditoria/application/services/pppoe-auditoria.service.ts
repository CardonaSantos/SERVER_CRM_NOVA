import { Injectable } from '@nestjs/common';
import { CreatePppoeAuditoriaDto } from '../dto/create-pppoe-auditoria.dto';
import { UpdatePppoeAuditoriaDto } from '../dto/update-pppoe-auditoria.dto';
import { ListarPppoeAuditoriasQueryDto } from '../dto/listar-pppoe-auditorias-query.dto';
import { PppoeAuditoriaPaginatedResult } from '../../domain/read-models/pppoe-auditoria-list.read-model';
import { ListarPppoeAuditoriasUseCase } from '../use-cases/listar-pppoe-auditorias.use-case';

@Injectable()
export class PppoeAuditoriaService {
  constructor(
    private readonly listarPppoeAuditoriasUseCase: ListarPppoeAuditoriasUseCase,
  ) {}

  findAll(
    query: ListarPppoeAuditoriasQueryDto,
  ): Promise<PppoeAuditoriaPaginatedResult> {
    return this.listarPppoeAuditoriasUseCase.execute(query);
  }
}
