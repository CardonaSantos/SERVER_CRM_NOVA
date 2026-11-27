import { EmpresaEntity } from '../entities/empresa.entity';

export const EMPRESA_REPOSITORY = Symbol('EMPRESA_REPOSITORY');

export interface EmpresaRepositoryPort {
  findById(id: number): Promise<EmpresaEntity | null>;

  /** Falla con `EMPRESA_NOMBRE_EN_USO` si otra fila ya tiene el nombre. */
  update(empresa: EmpresaEntity): Promise<EmpresaEntity>;
}
