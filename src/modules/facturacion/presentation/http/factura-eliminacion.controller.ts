import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { ListarFacturasEliminadasUseCase } from '../../application/use-cases/listar-facturas-eliminadas.use-case';
import { FacturaPresenter } from '../presenters/factura.presenter';

/** Bitácora de facturas eliminadas: solo se consulta, nunca se borra. */
@ApiTags('factura-eliminacion')
@Controller('factura-eliminacion')
export class FacturaEliminacionController {
  constructor(private readonly listar: ListarFacturasEliminadasUseCase) {}

  @Get()
  async eliminadas(@Query() query: PaginacionQueryDto) {
    return FacturaPresenter.eliminadas(
      await this.listar.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
      }),
    );
  }
}
