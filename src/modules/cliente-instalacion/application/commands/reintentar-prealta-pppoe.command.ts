export type ReintentarPrealtaPppoeCommand = {
  instalacionId: number;

  accesoInternetId: number;

  mikrotikRouterId: number;

  operadorId: number;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};
