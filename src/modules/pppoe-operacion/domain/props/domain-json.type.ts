export type DomainJsonPrimitive = string | number | boolean | null;

export type DomainJsonValue =
  | DomainJsonPrimitive
  | DomainJsonValue[]
  | {
      [key: string]: DomainJsonValue;
    };

export type DomainJsonObject = {
  [key: string]: DomainJsonValue;
};
