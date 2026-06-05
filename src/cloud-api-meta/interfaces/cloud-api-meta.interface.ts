export interface WhatsAppTemplatePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: TemplateData;
}

interface TemplateData {
  name: string;
  language: {
    code: string; // "es"
  };
  components: TemplateComponent[];
}

interface TemplateComponent {
  type: 'body' | 'header' | 'button';
  parameters: TemplateParameter[];
}

interface TemplateParameter {
  type: 'text';
  text: string;
}
