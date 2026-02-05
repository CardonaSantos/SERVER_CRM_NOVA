export class IP {
  constructor(
    private readonly id: number | null,
    private readonly direccionIp?: string,
    private readonly clienteId?: number,
    private readonly gateway?: string,
    private readonly mascara?: string,
  ) {}

  static crear(params: {
    direccionIp?: string;
    clienteId: number;
    gateway?: string;
    mascara?: string;
  }): IP {
    if (!params.clienteId) {
      throw new Error('No se puede crear una IP sin cliente asociado');
    }

    return new IP(
      null,
      params.direccionIp,
      params.clienteId,
      params.gateway,
      params.mascara,
    );
  }

  static rehidratar(props: {
    id: number;
    direccionIp?: string;
    clienteId?: number;
    gateway?: string;
    mascara?: string;
  }): IP {
    return new IP(
      props.id,
      props.direccionIp,
      props.clienteId,
      props.gateway,
      props.mascara,
    );
  }

  getId() {
    return this.id;
  }

  getDireccionIp() {
    return this.direccionIp;
  }

  getClienteId() {
    return this.clienteId;
  }

  getGateway() {
    return this.gateway;
  }

  getMascara() {
    return this.mascara;
  }
}

// MAPPER
export class IpMapper {
  static toPrisma(ip: IP) {
    return {
      direccionIp: ip.getDireccionIp(),
      clienteId: ip.getClienteId(),
      gateway: ip.getGateway(),
      mascara: ip.getMascara(),
    };
  }

  static toDomain(record: any): IP {
    return IP.rehidratar({
      id: record.id,
      direccionIp: record.direccionIp,
      clienteId: record.clienteId,
      gateway: record.gateway,
      mascara: record.mascara,
    });
  }
}
