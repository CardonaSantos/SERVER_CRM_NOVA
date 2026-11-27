export class DepartamentoResponseDto {
  /** Id del departamento */ id: number;
  /** Nombre */ nombre: string;
}

export class MunicipioResponseDto {
  /** Id del municipio */ id: number;
  /** Nombre */ nombre: string;
  /** Departamento */ departamentoId: number;
}
