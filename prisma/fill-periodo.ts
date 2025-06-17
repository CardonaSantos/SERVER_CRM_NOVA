// scripts/fillPeriodo.ts
import { PrismaClient } from '@prisma/client';
import * as dayjs from 'dayjs';
const prisma = new PrismaClient();

async function main() {
  const facturas = await prisma.facturaInternet.findMany({
    select: { id: true, fechaPagoEsperada: true },
  });

  console.log('Facturas encontradas: ', facturas.length);

  for (const f of facturas) {
    const periodo = dayjs(f.fechaPagoEsperada).format('YYYYMM');
    await prisma.facturaInternet.update({
      where: { id: f.id },
      data: { periodo },
    });
  }
  console.log(`Actualizadas ${facturas.length} facturas.`);
}

main().finally(() => prisma.$disconnect());
