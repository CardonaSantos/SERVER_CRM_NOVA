export class UpdateCustomerNetworkConfigDto {
  clienteId: number;
  direccionIp: string;
  gateway: string;
  mascara: string;

  // seguridad / auditoría
  userId: number;
  password: string;
}
export class UpdateCustomerIpConfigDto {
  clienteId: number;
  direccionIp: string;
  gateway: string;
  mascara: string;
}
