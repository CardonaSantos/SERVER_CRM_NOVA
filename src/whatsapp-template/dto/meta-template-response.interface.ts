export interface MetaPagingCursor {
  before?: string;
  after?: string;
}

export interface MetaPaging {
  cursors?: MetaPagingCursor;
  next?: string;
  previous?: string;
}

export interface MetaListResponse<T> {
  data: T[];
  paging?: MetaPaging;
}

export interface MetaWhatsappTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components?: Record<string, any>[];
}

export interface MetaCreateTemplateResponse {
  id: string;
  status: string;
  category?: string;
}

export interface MetaUploadSessionResponse {
  id: string;
}

export interface MetaUploadHandleResponse {
  h: string;
}
