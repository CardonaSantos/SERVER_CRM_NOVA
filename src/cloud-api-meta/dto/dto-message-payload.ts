export interface WhatsAppTemplatePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: TemplateData;
}

export interface TemplateData {
  name: string;
  language: {
    code: string;
  };
  components?: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button' | string;
  parameters?: TemplateParameter[];
}

export type TemplateParameter =
  | TextTemplateParameter
  | ImageTemplateParameter
  | VideoTemplateParameter
  | DocumentTemplateParameter;

export interface TextTemplateParameter {
  type: 'text';
  text: string;
}

export interface ImageTemplateParameter {
  type: 'image';
  image: {
    link: string;
  };
}

export interface VideoTemplateParameter {
  type: 'video';
  video: {
    link: string;
  };
}

export interface DocumentTemplateParameter {
  type: 'document';
  document: {
    link: string;
    filename?: string;
  };
}
