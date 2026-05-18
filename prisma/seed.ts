import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(' Iniciando seed de la base de datos...');

  // Crear una empresa
  const empresa = await prisma.empresa.create({
    data: {
      nombre: 'Asociación ADIPY',
      direccion: 'Cantón Pozo, Concepción Huista 01322-Concepción, Guatemala',
      telefono: '4045 0131',
      pbx: '4045 0131',
      correo: 'yamanonhadipy@hotmail.com',
      sitioWeb: '',
      nit: '',
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
