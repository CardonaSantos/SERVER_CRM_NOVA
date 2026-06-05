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

export class SendWhatsappCampaignDto {
  templateId: string;
  templateName: string;
  templateLanguage: string;
  headerImageUrl?: string;

  templateCategory: WhatsappTemplateCategory | string;

  sendMode: WhatsappCampaignSendMode;
  customerIds: number[];

  recipients: WhatsappCampaignRecipientDto[];

  estimatedCost?: WhatsappCampaignEstimatedCostDto;
  filtersSnapshot?: WhatsappCampaignFiltersSnapshotDto;

  createdAt?: string;
}
