import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-cliente.enum';
import { OrdenClientesRuta } from '../../domain/read-models/cliente-listado.read-model';
import { ESTADOS_CLIENTE_FILTRABLES } from './listar-clientes-query.dto';

/** `?zonaIds=1&zonaIds=2` o `?zonaIds=1,2`; lo que no sea número se rechaza. */
const ComoNumeros = () =>
  Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;

    return (Array.isArray(value) ? value : [value])
      .flatMap((v) => String(v).split(','))
      .filter((v) => v.trim() !== '')
      .map(Number);
  });

export class ListarClientesRutaQueryDto extends PaginacionQueryDto {
  /** Estado operativo */
  @IsOptional()
  @IsIn(ESTADOS_CLIENTE_FILTRABLES)
  estado?: string;

  /** Estado de cobranza */
  @IsOptional()
  @IsEnum(EstadoCobranzaCliente)
  estadoCobranza?: EstadoCobranzaCliente;

  /** Zonas de facturación */
  @IsOptional()
  @ComoNumeros()
  @IsInt({ each: true })
  @Min(1, { each: true })
  zonaIds?: number[];

  /** Sectores */
  @IsOptional()
  @ComoNumeros()
  @IsInt({ each: true })
  @Min(1, { each: true })
  sectorIds?: number[];

  /** Columna de orden */
  @IsOptional()
  @IsIn(['nombre', 'saldo'])
  sortBy?: OrdenClientesRuta;
}
