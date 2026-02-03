export const CREDITO_CRON_REPOSITORY = Symbol('CREDITO_CRON_REPOSITORY');

export interface CreditoCronRepository {
  generateMoraCreditoCuota: () => void;
}
