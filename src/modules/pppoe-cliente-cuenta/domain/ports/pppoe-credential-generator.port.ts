export interface PppoeCredentialGeneratorPort {
  generatePassword(fecha?: Date): string;
}
