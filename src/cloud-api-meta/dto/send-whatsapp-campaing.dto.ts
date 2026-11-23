import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export type WhatsappTemplateCategory =
  | 'MARKETING'
  | 'UTILITY'
  | 'AUTHENTICATION';

export type WhatsappCampaignSendMode = 'ALL_VALID' | 'SELECTED';

export interface WhatsappCampaignRecipientDto {
  customerId: number;
  fullName: string;
  phone: string;
}

export interface WhatsappCampaignEstimatedCostDto {
  currency: 'USD' | 'GTQ';
  unitCost: number;
  totalRecipients: number;
  totalEstimated: number;
}

export interface WhatsappCampaignFiltersSnapshotDto {
  search?: string;
  purchaseFilter?: string;
  phoneFilter?: string;
  locationFilter?: string;
}

/*
 * Validadores (etapa 8): antes la clase no tenía ninguno; con el
 * ValidationPipe estricto, `whitelist` habría vaciado el body. Los objetos
 * anidados (recipients, estimatedCost, filtersSnapshot) se validan como
 * arreglo/objeto y su contenido se conserva tal cual.
 */
export class SendWhatsappCampaignDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsString()
  @IsNotEmpty()
  templateLanguage: string;

  @IsOptional()
  @IsString()
  headerImageUrl?: string;

  @IsString()
  templateCategory: WhatsappTemplateCategory | string;

  @IsIn(['ALL_VALID', 'SELECTED'])
  sendMode: WhatsappCampaignSendMode;

  @IsArray()
  @IsInt({ each: true })
  customerIds: number[];

  @IsArray()
  @IsObject({ each: true })
  recipients: WhatsappCampaignRecipientDto[];

  @IsOptional()
  @IsObject()
  estimatedCost?: WhatsappCampaignEstimatedCostDto;

  @IsOptional()
  @IsObject()
  filtersSnapshot?: WhatsappCampaignFiltersSnapshotDto;

  @IsOptional()
  @IsString()
  createdAt?: string;
}
