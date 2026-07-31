DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE
      schemaname = 'public'
      AND tablename = 'ClienteDesinstalacion'
      AND indexname =
        'ClienteDesinstalacion_accesoInternetId_activa_key'
  ) THEN
    RAISE EXCEPTION
      'No existe el índice ClienteDesinstalacion_accesoInternetId_activa_key';
  END IF;
END
$$;