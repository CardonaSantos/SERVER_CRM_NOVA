import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear una empresa
  const empresa = await prisma.empresa.create({
    data: {
      nombre: 'Nova Sistemas S.A.',
      direccion: 'Jacaltenango, Huehuetenango, Zona 2',
      telefono: '4001-7273',
      pbx: '50255556789',
      correo: 'novasistemassa@gmail.net',
      sitioWeb: 'https://www.facebook.com/Novasistemasgt/?locale=es_LA',
      nit: '1234567-8',
      logo1: 'https://mi-servidor.com/logos/logo1.png',
      logo2: 'https://mi-servidor.com/logos/logo2.png',
      logo3: 'https://mi-servidor.com/logos/logo3.png',
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
