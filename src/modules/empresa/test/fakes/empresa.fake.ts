import { EmpresaEntity } from '../../domain/entities/empresa.entity';
import { EmpresaRepositoryPort } from '../../domain/ports/empresa-repository.port';
import { EmpresaProps } from '../../domain/props/empresa.props';

export function empresaDePrueba(): EmpresaProps {
  return {
    id: 1,
    nombre: 'Empresa Demo',
    direccion: 'Zona 1',
    telefono: '0000 0000',
    pbx: null,
    correo: 'contacto@example.com',
    sitioWeb: null,
    nit: 'CF',
    logo1: 'https://example.com/logo.png',
    logo2: null,
    logo3: null,
    actualizadoEn: new Date('2026-01-01T00:00:00.000Z'),
  };
}

export class EmpresaRepositoryFake implements EmpresaRepositoryPort {
  guardada: EmpresaProps | null = empresaDePrueba();

  async findById(id: number) {
    return this.guardada?.id === id
      ? EmpresaEntity.hydrate(this.guardada)
      : null;
  }

  async update(empresa: EmpresaEntity) {
    this.guardada = empresa.toPrimitives();

    return EmpresaEntity.hydrate(this.guardada);
  }
}
