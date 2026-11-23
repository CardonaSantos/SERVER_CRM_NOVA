import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_RUTA = 'docs';

/** Nombre del esquema de seguridad Bearer en el documento OpenAPI. */
export const SWAGGER_ESQUEMA_JWT = 'jwt';

const logger = new Logger('Swagger');

/**
 * Monta la documentación OpenAPI en /docs.
 *
 * Seguro por omisión: solo se monta si SWAGGER_HABILITADO=true. No depende
 * de NODE_ENV (no está garantizado en Railway), así que un deploy nunca la
 * expone por accidente. La doc describe rutas y DTOs, no los protege: los
 * endpoints siguen exigiendo JWT aunque la doc esté visible.
 */
export function configurarSwagger(app: INestApplication): void {
  if (process.env.SWAGGER_HABILITADO !== 'true') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('CRM NOVA API')
    .setDescription(
      'API del CRM NOVA. Autenticación: JWT Bearer obtenido en ' +
        'POST /auth/login-user (botón "Authorize").',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      SWAGGER_ESQUEMA_JWT,
    )
    // Seguridad por omisión en la doc: casi toda la API exige JWT.
    .addSecurityRequirements(SWAGGER_ESQUEMA_JWT)
    .build();

  const documento = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_RUTA, app, documento, {
    jsonDocumentUrl: `${SWAGGER_RUTA}/json`,
    swaggerOptions: { persistAuthorization: true },
  });

  if (process.env.NODE_ENV === 'production') {
    logger.warn(`Documentación expuesta en /${SWAGGER_RUTA} en producción.`);
  } else {
    logger.log(`Documentación en /${SWAGGER_RUTA}`);
  }
}
