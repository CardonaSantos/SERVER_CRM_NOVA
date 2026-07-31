-- ============================================================
-- Solo una desinstalación activa por acceso de internet
-- Estados activos: PROGRAMADA y EN_PROCESO
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ClienteDesinstalacion"
    WHERE
      "accesoInternetId" IS NOT NULL
      AND "estado" IN (
        'PROGRAMADA'::"EstadoDesinstalacionCliente",
        'EN_PROCESO'::"EstadoDesinstalacionCliente"
      )
    GROUP BY "accesoInternetId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Existen accesos con más de una desinstalación activa. Corrija los duplicados antes de aplicar la migración.';
  END IF;
END
$$;

CREATE UNIQUE INDEX
  "ClienteDesinstalacion_accesoInternetId_activa_key"
ON "ClienteDesinstalacion" ("accesoInternetId")
WHERE
  "accesoInternetId" IS NOT NULL
  AND "estado" IN (
    'PROGRAMADA'::"EstadoDesinstalacionCliente",
    'EN_PROCESO'::"EstadoDesinstalacionCliente"
  );