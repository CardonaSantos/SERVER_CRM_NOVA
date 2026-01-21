export class UpdateCustomerIpAndNetworkDto {
  clienteId: number;
  direccionIp: string;
  gateway: string;
  mascara: string;

  // seguridad / auditoría
  userId: number;
  password: string;
}
