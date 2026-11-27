-- El nombre de un municipio se repite entre departamentos: la unicidad pasa a
-- (nombre, departamento) y se agregan los seis que la regla anterior dejaba
-- fuera. El DROP INDEX lo autorizó el dueño (26-nov-2026); no borra datos.

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_nombre_departamentoId_key" ON "Municipio"("nombre", "departamentoId");

-- DropIndex
DROP INDEX "Municipio_nombre_key";

-- Municipios faltantes (en una base sin departamentos no inserta nada).
INSERT INTO "Municipio" ("nombre", "departamentoId")
SELECT v.nombre, d."id"
FROM (VALUES
  ('La Democracia', 'Huehuetenango'),
  ('San José', 'Petén'),
  ('San Pedro Sacatepéquez', 'San Marcos'),
  ('La Libertad', 'Petén'),
  ('Santa Bárbara', 'Suchitepéquez'),
  ('San Lorenzo', 'Suchitepéquez')
) AS v(nombre, departamento)
JOIN "Departamento" d ON d."nombre" = v.departamento
ON CONFLICT ("nombre", "departamentoId") DO NOTHING;
