// server/src/web-sockets/dto/credit-authorization.dto.ts
export interface CreditAuthorizationRequestDto {
  ventaId: number;
  monto: number;
  comentario?: string;
}
export interface CreditAuthorizationCreatedEvent {
  id: number; // id de la solicitud creada
  ventaId: number;
  monto: number;
  solicitadoPor: number; // userId solicitante
  createdAt: string;
}
