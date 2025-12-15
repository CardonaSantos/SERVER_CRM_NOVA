// Interfaces para la API de Meta Cloud (WhatsApp)

export interface WhatsAppTemplatePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: TemplateData;
}

interface TemplateData {
  name: string;
  language: {
    code: string; // Ej: "es"
  };
  components: TemplateComponent[];
}

interface TemplateComponent {
  type: 'body' | 'header' | 'button';
  parameters: TemplateParameter[];
}

interface TemplateParameter {
  type: 'text'; // Podría ser "image", "document", etc. en otros casos
  text: string;
}
