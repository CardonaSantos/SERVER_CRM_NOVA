// src/modules/media/infra/storage/spaces.config.ts
export type SpacesConfig = {
  region: string; // ej. 'nyc3'
  endpoint: string; // ej. 'https://nyc3.digitaloceanspaces.com'
  accessKeyId: string;
  secretAccessKey: string;
  defaultBucket: string; // tu bucket
  cdnBase: string; // ej. 'https://<bucket>.<region>.cdn.digitaloceanspaces.com'
};
