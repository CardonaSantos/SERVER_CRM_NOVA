import {
  CategoriaPlantilla,
  EstadoPlantilla,
  FormatoEncabezado,
  TipoComponentePlantilla,
} from '../enums/plantilla.enum';
import {
  MensajeriaPlantillaInvalidaError,
  MensajeriaPlantillaNoEnviableError,
} from '../errors/mensajeria-cliente.errors';
import {
  ComponentePlantilla,
  PlantillaReadModel,
} from '../read-models/plantilla.read-model';

const VARIABLE = /\{\{[^}]+\}\}/;

/** WhatsApp solo admite minúsculas, números y guion bajo. */
export function asegurarNombrePlantilla(nombre: string): void {
  if (!/^[a-z0-9_]+$/.test(nombre)) {
    throw new MensajeriaPlantillaInvalidaError(
      'El nombre solo puede llevar minúsculas, números y guion bajo.',
    );
  }
}

/**
 * El cuerpo sin variables no lleva ejemplos (WhatsApp lo rechaza); con
 * variables los exige todos.
 */
export function sanearComponentes(
  componentes: ComponentePlantilla[],
): ComponentePlantilla[] {
  return componentes.map((componente) => {
    if (componente.type !== TipoComponentePlantilla.BODY) return componente;

    if (!VARIABLE.test(componente.text ?? '')) {
      const sinEjemplo = { ...componente };
      delete sinEjemplo.example;
      return sinEjemplo;
    }

    const ejemplos = componente.example?.body_text?.[0];
    const completos =
      Array.isArray(ejemplos) &&
      ejemplos.length > 0 &&
      ejemplos.every((valor) => String(valor).trim().length > 0);
    if (!completos) {
      throw new MensajeriaPlantillaInvalidaError(
        'Escribe un ejemplo para cada variable del cuerpo.',
      );
    }
    return componente;
  });
}

export function componentesDePlantillaConImagen(input: {
  headerHandle?: string;
  bodyText: string;
  bodyExample: string[][];
  footerText?: string;
}): ComponentePlantilla[] {
  const componentes: ComponentePlantilla[] = [];

  if (input.headerHandle) {
    componentes.push({
      type: TipoComponentePlantilla.HEADER,
      format: FormatoEncabezado.IMAGE,
      example: { header_handle: [input.headerHandle] },
    });
  }
  componentes.push({
    type: TipoComponentePlantilla.BODY,
    text: input.bodyText,
    example: { body_text: input.bodyExample },
  });
  if (input.footerText) {
    componentes.push({
      type: TipoComponentePlantilla.FOOTER,
      text: input.footerText,
    });
  }
  return componentes;
}

/**
 * Una campaña envía el mismo mensaje a todos, con una imagen como único dato:
 * lo que necesite más se rechaza antes de enviar a nadie.
 */
export function asegurarEnviableEnCampania(
  plantilla: PlantillaReadModel,
  imagenUrl: string | null,
): void {
  const rechazar = (mensaje: string): never => {
    throw new MensajeriaPlantillaNoEnviableError(mensaje);
  };

  if (plantilla.status !== EstadoPlantilla.APPROVED) {
    rechazar('La plantilla todavía no está aprobada por WhatsApp.');
  }
  if (plantilla.category === CategoriaPlantilla.AUTHENTICATION) {
    rechazar('Las plantillas de autenticación no se envían en campañas.');
  }

  let pideImagen = false;
  for (const componente of plantilla.components) {
    if (componente.type === TipoComponentePlantilla.CAROUSEL) {
      rechazar('Las plantillas con carrusel no se pueden enviar en campañas.');
    }
    if (componente.type === TipoComponentePlantilla.HEADER) {
      if (componente.format === FormatoEncabezado.IMAGE) pideImagen = true;
      else if (componente.format !== FormatoEncabezado.TEXT) {
        rechazar('Solo se admite encabezado de texto o de imagen.');
      }
    }
    const textos = [
      componente.text,
      ...(componente.buttons ?? []).map((boton) => boton.url),
    ];
    if (textos.some((texto) => VARIABLE.test(texto ?? ''))) {
      rechazar(
        'La plantilla usa variables y las campañas todavía no las admiten.',
      );
    }
  }

  if (pideImagen && !imagenUrl) {
    rechazar('Esta plantilla necesita la dirección de la imagen.');
  }
  if (!pideImagen && imagenUrl) {
    rechazar('Esta plantilla no lleva imagen.');
  }
}
