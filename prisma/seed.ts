import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(' Iniciando seed de la base de datos...');

  // Crear una empresa
  const empresa = await prisma.empresa.create({
    // Datos de ejemplo: los reales se cargan con PATCH /empresa.
    data: {
      nombre: 'Empresa Demo',
      direccion: 'Dirección de ejemplo',
      telefono: '0000 0000',
      correo: 'contacto@example.com',
      nit: 'CF',
    },
  });

  console.log('✅ Empresa creada:', empresa);
}

main()
  .catch((error) => {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexión cerrada.');
  });
