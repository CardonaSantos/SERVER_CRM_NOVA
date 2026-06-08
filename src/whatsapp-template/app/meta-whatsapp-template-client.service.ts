import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { CreateWhatsappTemplateDto } from '../dto/create-whatsapp-template.dto';
import { CreateRawWhatsappTemplateDto } from '../dto/create-raw-whatsapp-template.dto';
import { QueryWhatsappTemplateDto } from '../dto/query-whatsapp-template.dto';
import { UpdateWhatsappTemplateDto } from '../dto/update-whatsapp-template.dto';
import {
  MetaCreateTemplateResponse,
  MetaListResponse,
  MetaUploadHandleResponse,
  MetaUploadSessionResponse,
  MetaWhatsappTemplate,
} from '../dto/meta-template-response.interface';

@Injectable()
export class MetaWhatsappTemplateClientService {
  private readonly logger = new Logger(MetaWhatsappTemplateClientService.name);

  private readonly graphVersion: string;
  private readonly graphBaseUrl: string;
  private readonly wabaId: string;
  private readonly appId: string;
  private readonly apiToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.graphVersion =
      this.configService.get<string>('META_GRAPH_VERSION') ?? 'v21.0';

    this.graphBaseUrl = `https://graph.facebook.com/${this.graphVersion}`;

    this.wabaId = this.configService.getOrThrow<string>('WHATSAPP_WABA_ID');
    this.appId = this.configService.getOrThrow<string>('META_APP_ID');
    this.apiToken = this.configService.getOrThrow<string>('WHATSAPP_API_TOKEN');
  }

  // HELPERS
  private readonly variableRegex = /\{\{(\d+)\}\}/g;

  private hasTemplateVariables(text?: string): boolean {
    if (!text) return false;
    return this.variableRegex.test(text);
  }

  private sanitizeComponentsForMeta(components: any[]) {
    return components.map((component) => {
      if (component.type !== 'BODY') {
        return component;
      }

      const bodyText = component.text ?? '';
      const hasVariables = /\{\{(\d+)\}\}/g.test(bodyText);

      /**
       * Si el BODY no tiene variables, Meta NO necesita example.body_text.
       * Si llega example vacío desde el frontend, lo eliminamos.
       */
      if (!hasVariables) {
        const { example, ...bodyWithoutExample } = component;
        return bodyWithoutExample;
      }

      /**
       * Si el BODY sí tiene variables, example.body_text es obligatorio.
       */
      const bodyTextExample = component.example?.body_text?.[0];

      const hasValidExamples =
        Array.isArray(bodyTextExample) &&
        bodyTextExample.length > 0 &&
        bodyTextExample.every((value) => String(value).trim().length > 0);

      if (!hasValidExamples) {
        throw new BadRequestException(
          'Meta requiere example.body_text con valores para todas las variables del BODY.',
        );
      }

      return component;
    });
  }

  private get templatesUrl() {
    return `${this.graphBaseUrl}/${this.wabaId}/message_templates`;
  }

  private get authHeaders() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  async createTemplate(
    dto: CreateWhatsappTemplateDto,
  ): Promise<MetaCreateTemplateResponse> {
    const payload = {
      name: dto.name,
      language: dto.language ?? 'es',
      category: dto.category,
      components: this.sanitizeComponentsForMeta(dto.components),
    };

    this.logger.log(
      `DTO de plantilla recibido:\n${JSON.stringify(dto, null, 2)}`,
    );

    this.logger.log(
      `Payload saneado para Meta:\n${JSON.stringify(payload, null, 2)}`,
    );

    try {
      const { data } = await lastValueFrom(
        this.httpService.post<MetaCreateTemplateResponse>(
          this.templatesUrl,
          payload,
          {
            headers: this.authHeaders,
          },
        ),
      );

      return data;
    } catch (error) {
      this.handleMetaError(error, 'Error creando plantilla en Meta');
    }
  }

  async createRawTemplate(
    dto: CreateRawWhatsappTemplateDto,
  ): Promise<MetaCreateTemplateResponse> {
    const payload = {
      name: dto.name,
      language: dto.language ?? 'es',
      category: dto.category,
      components: dto.components,
    };

    try {
      const { data } = await lastValueFrom(
        this.httpService.post<MetaCreateTemplateResponse>(
          this.templatesUrl,
          payload,
          {
            headers: this.authHeaders,
          },
        ),
      );

      return data;
    } catch (error) {
      this.handleMetaError(error, 'Error creando plantilla RAW en Meta');
    }
  }

  async listTemplates(
    query: QueryWhatsappTemplateDto,
  ): Promise<MetaListResponse<MetaWhatsappTemplate>> {
    const params: Record<string, string | number> = {
      fields: 'id,name,status,category,language,components',
      limit: query.limit ? Number(query.limit) : 100,
    };

    if (query.name) params.name = query.name;
    if (query.language) params.language = query.language;
    if (query.category) params.category = query.category;
    if (query.status) params.status = query.status;
    if (query.after) params.after = query.after;

    try {
      const { data } = await lastValueFrom(
        this.httpService.get<MetaListResponse<MetaWhatsappTemplate>>(
          this.templatesUrl,
          {
            headers: this.authHeaders,
            params,
          },
        ),
      );

      return data;
    } catch (error) {
      this.handleMetaError(error, 'Error listando plantillas desde Meta');
    }
  }

  async getTemplateById(templateId: string): Promise<MetaWhatsappTemplate> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get<MetaWhatsappTemplate>(
          `${this.graphBaseUrl}/${templateId}`,
          {
            headers: this.authHeaders,
            params: {
              fields: 'id,name,status,category,language,components',
            },
          },
        ),
      );

      return data;
    } catch (error) {
      this.handleMetaError(error, 'Error obteniendo plantilla por ID');
    }
  }

  async updateTemplate(
    templateId: string,
    dto: UpdateWhatsappTemplateDto,
  ): Promise<Record<string, any>> {
    const payload: Record<string, any> = {};

    if (dto.category) payload.category = dto.category;
    if (dto.components) payload.components = dto.components;

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(
        'No hay campos válidos para actualizar en Meta.',
      );
    }

    try {
      const { data } = await lastValueFrom(
        this.httpService.post<Record<string, any>>(
          `${this.graphBaseUrl}/${templateId}`,
          payload,
          {
            headers: this.authHeaders,
          },
        ),
      );

      return data;
    } catch (error) {
      this.handleMetaError(error, 'Error actualizando plantilla en Meta');
    }
  }

  async deleteTemplateByName(name: string): Promise<Record<string, any>> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.delete<Record<string, any>>(this.templatesUrl, {
          headers: this.authHeaders,
          params: {
            name,
          },
        }),
      );

      return data;
    } catch (error) {
      this.handleMetaError(error, 'Error eliminando plantilla por nombre');
    }
  }

  /**
   * Paso 1: crea sesión de subida.
   * Paso 2: sube el binario.
   * Retorna el handle que va en:
   * components[].example.header_handle = [handle]
   */
  async uploadTemplateMediaHandle(file: Express.Multer.File): Promise<{
    handle: string;
    fileName: string;
    mimeType: string;
    size: number;
  }> {
    if (!file) {
      throw new BadRequestException(
        'Debes enviar un archivo en el campo file.',
      );
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'Por ahora este endpoint acepta imágenes. Para documentos/video, ajusta la validación.',
      );
    }

    const uploadSession = await this.createUploadSession(file);
    const uploadHandle = await this.uploadBinaryToSession(
      uploadSession.id,
      file,
    );

    return {
      handle: uploadHandle.h,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  private async createUploadSession(
    file: Express.Multer.File,
  ): Promise<MetaUploadSessionResponse> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<MetaUploadSessionResponse>(
          `${this.graphBaseUrl}/${this.appId}/uploads`,
          null,
          {
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
            },
            params: {
              file_name: file.originalname,
              file_length: file.size,
              file_type: file.mimetype,
            },
          },
        ),
      );

      return data;
    } catch (error) {
      this.handleMetaError(error, 'Error creando sesión de subida en Meta');
    }
  }

  private async uploadBinaryToSession(
    uploadSessionId: string,
    file: Express.Multer.File,
  ): Promise<MetaUploadHandleResponse> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<MetaUploadHandleResponse>(
          `${this.graphBaseUrl}/${uploadSessionId}`,
          file.buffer,
          {
            headers: {
              Authorization: `OAuth ${this.apiToken}`,
              file_offset: '0',
              'Content-Type': file.mimetype,
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          },
        ),
      );

      return data;
    } catch (error) {
      this.handleMetaError(error, 'Error subiendo archivo a Meta');
    }
  }

  private handleMetaError(error: unknown, fallbackMessage: string): never {
    const axiosError = error as AxiosError<any>;

    const metaError = axiosError.response?.data;

    this.logger.error(
      fallbackMessage,
      JSON.stringify(metaError ?? axiosError.message, null, 2),
    );

    if (axiosError.response?.status) {
      throw new BadRequestException({
        message: fallbackMessage,
        statusCode: axiosError.response.status,
        meta: metaError,
      });
    }

    throw new InternalServerErrorException({
      message: fallbackMessage,
      error: axiosError.message,
    });
  }
}
