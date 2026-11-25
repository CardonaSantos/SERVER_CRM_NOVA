#!/usr/bin/env bash
# Checklist de conformidad del estándar hexagonal (§12).
# Uso (desde la raíz del repo): bash scripts/conformidad-hexagonal.sh <modulo>
# Cada sección debe salir vacía.
export LC_ALL=C.UTF-8
N="$1"
M="src/modules/$N"
[ -d "$M" ] || { echo "No existe $M"; exit 1; }

seccion() { printf '\n## %s\n' "$1"; }
dirs() { for d in "$@"; do [ -d "$M/$d" ] && printf '%s ' "$M/$d"; done; }

seccion "1. Dominio puro"
D=$(dirs domain); [ -n "$D" ] && grep -rlE "from '@nestjs|from '@prisma|PrismaService|from 'express'|from 'dayjs'" $D

seccion "2. Aplicación sin Prisma/Express/excepciones HTTP"
A=$(dirs application); [ -n "$A" ] && grep -rlE "from '@prisma|PrismaService|from 'express'|[A-Za-z]+Exception\b" $A
DA=$(dirs domain application); [ -n "$DA" ] && grep -rnP "from '@nestjs/(?!common')" $DA

seccion "3. Entra en carpetas internas de otros módulos"
grep -rnP "from '(src/modules/|(\.\./)+)(?!$N/)[a-z-]+/(domain|application|infra|infraestructure|presentation|tokens|dto)/" $M

seccion "4. Tokens fuera de .port.ts"
grep -rn "Symbol(" $M | grep -v "\.port\.ts:"

seccion "5. new Date() en dominio/aplicación"
[ -n "$DA" ] && grep -rn "new Date()" $DA

seccion "6. throw new Error en dominio/aplicación (revisar: solo 'never')"
[ -n "$DA" ] && grep -rn "throw new Error(" $DA

seccion "7. Guards/pipes locales, IP manual, AuthenticatedRequest"
grep -rlE "x-forwarded-for|UsePipes|UseGuards\(JwtAuthGuard|new ValidationPipe|AuthenticatedRequest" $M

seccion "8. Código muerto"
find $M -name '*.ts' -empty; grep -rlE "This action (adds|returns)" $M; find $M -name '*.ts.ts'

seccion "9. Carpetas fuera del árbol canónico"
PERMITIDAS='^(/public|/domain|/domain/(entities|props|value-objects|enums|errors|policies|read-models|ports)|/application|/application/(use-cases|services|ports|facade)|/infra|/infra/[a-z0-9-]+|/presentation|/presentation/(http|dto|presenters|ws|cron|eventos)|/test|/test/fakes)$'
find $M -mindepth 1 -type d | sed "s|^$M||" | grep -vE "$PERMITIDAS"

seccion "10. Nombres con 'ppoe'"
find $M -name '*ppoe*' | grep -v pppoe

seccion "11. Otros módulos que entran en este (deben usar public/ o el .module.ts)"
grep -rnP "from '[^']*modules/$N/(?!public/|$N\.module')" --include=*.ts src | grep -v "^$M/"

seccion "12. Entidades sin spec"
for e in $(find $M -name '*.entity.ts' 2>/dev/null); do [ -f "${e%.ts}.spec.ts" ] || echo "$e"; done

seccion "13. Validación de rol en dominio/aplicación (va en @Roles del controlador)"
[ -n "$DA" ] && grep -rnE "actorRol|rolNormalizado|normalizedRole|RolUsuario\.|'(OFICINA|TECNICO|COORDINADOR_OPERACIONES)'" $DA
echo
