export enum TecnologiaAccesoInternet {
  FIBRA_GPON = 'FIBRA_GPON',
  INALAMBRICO = 'INALAMBRICO',
  ETHERNET = 'ETHERNET',
  OTRO = 'OTRO',
}

export enum MetodoAutenticacionInternet {
  PPPOE = 'PPPOE',
  DHCP = 'DHCP',
  IP_ESTATICA = 'IP_ESTATICA',
  NINGUNO = 'NINGUNO',
}

export enum EstadoAccesoInternet {
  PENDIENTE = 'PENDIENTE',
  CONFIGURANDO = 'CONFIGURANDO',
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  BAJA = 'BAJA',
}
