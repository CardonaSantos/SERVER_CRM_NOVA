export const GENERATE_REPORTS = Symbol('GENERATE_REPORTS');

export interface GenerateReportsRepository {
  generateHistorialPagos(ids: Array<number>): Promise<Buffer>;

  exportInfo(ids: Array<number>): Promise<Buffer>;
}
