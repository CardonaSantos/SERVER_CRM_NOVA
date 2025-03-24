import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}
  create(createLocationDto: CreateLocationDto) {
    return 'This action adds a new location';
  }

  findAll() {
    return `This action returns all location`;
  }

  async findAllDepartamentos() {
    try {
      const depas = await this.prisma.departamento.findMany({
        // include: {
        //   municipios: {
        //     select: {
        //       nombre: true,
        //       id: true,
        //     },
        //   },
        // },
      });
      return depas;
    } catch (error) {
      console.log(error);
    }
  }

  async findAllMunicipios() {
    try {
      const muni = await this.prisma.municipio.findMany({});
      return muni;
    } catch (error) {
      console.log(error);
    }
  }

  async findMunicipio(id: number) {
    try {
      console.log('el id es: ', id);

      const muni = await this.prisma.municipio.findMany({
        where: {
          departamentoId: Number(id),
        },
      });
      console.log('encontrado: ', muni);

      return muni;
    } catch (error) {
      console.log(error);
    }
  }

  async deleteAllMunicipios() {
    const x = await await this.prisma.municipio.deleteMany({});
    const y = await this.deleteAllDepartamentos();
    console.log('Eliminados correctamente', x, y);

    return;
  }

  async deleteAllDepartamentos() {
    return await await this.prisma.departamento.deleteMany({});
  }

  findOne(id: number) {
    return `This action returns a #${id} location`;
  }

  update(id: number, updateLocationDto: UpdateLocationDto) {
    return `This action updates a #${id} location`;
  }

  remove(id: number) {
    return `This action removes a #${id} location`;
  }

  async setDepartamentos() {
    try {
      const departamentos = [
        { nombre: 'Alta Verapaz' },
        { nombre: 'Baja Verapaz' },
        { nombre: 'Chimaltenango' },
        { nombre: 'Chiquimula' },
        { nombre: 'El Progreso' },
        { nombre: 'Escuintla' },
        { nombre: 'Guatemala' },
        { nombre: 'Huehuetenango' },
        { nombre: 'Izabal' },
        { nombre: 'Jalapa' },
        { nombre: 'Jutiapa' },
        { nombre: 'Petén' },
        { nombre: 'Quetzaltenango' },
        { nombre: 'Quiché' },
        { nombre: 'Retalhuleu' },
        { nombre: 'Sacatepéquez' },
        { nombre: 'San Marcos' },
        { nombre: 'Santa Rosa' },
        { nombre: 'Sololá' },
        { nombre: 'Suchitepéquez' },
        { nombre: 'Totonicapán' },
        { nombre: 'Zacapa' },
      ];

      const insertedDepartamentos = await this.prisma.departamento.createMany({
        data: departamentos,
        skipDuplicates: true, // Evita insertar duplicados
      });

      return {
        message: 'Departamentos insertados correctamente',
        insertedDepartamentos,
      };
    } catch (error) {
      console.error('Error al insertar departamentos:', error);
      throw new Error('No se pudieron insertar los departamentos');
    }
  }

  async setMunicipios() {
    try {
      const municipios = [
        { nombre: 'Chahal', departamentoId: 1 },
        { nombre: 'Chisec', departamentoId: 1 },
        { nombre: 'Cobán', departamentoId: 1 },
        { nombre: 'Fray Bartolomé de las Casas', departamentoId: 1 },
        { nombre: 'La Tinta', departamentoId: 1 },
        { nombre: 'Lanquín', departamentoId: 1 },
        { nombre: 'Panzós', departamentoId: 1 },
        { nombre: 'Raxruhá', departamentoId: 1 },
        { nombre: 'San Cristóbal Verapaz', departamentoId: 1 },
        { nombre: 'San Juan Chamelco', departamentoId: 1 },
        { nombre: 'San Pedro Carchá', departamentoId: 1 },
        { nombre: 'Santa Cruz Verapaz', departamentoId: 1 },
        { nombre: 'Santa María Cahabón', departamentoId: 1 },
        { nombre: 'Senahú', departamentoId: 1 },
        { nombre: 'Tamahú', departamentoId: 1 },
        { nombre: 'Tactic', departamentoId: 1 },
        { nombre: 'Tucurú', departamentoId: 1 },

        // Baja Verapaz
        { nombre: 'Cubulco', departamentoId: 2 },
        { nombre: 'Granados', departamentoId: 2 },
        { nombre: 'Purulhá', departamentoId: 2 },
        { nombre: 'Rabinal', departamentoId: 2 },
        { nombre: 'Salamá', departamentoId: 2 },
        { nombre: 'San Jerónimo', departamentoId: 2 },
        { nombre: 'San Miguel Chicaj', departamentoId: 2 },
        { nombre: 'Santa Cruz el Chol', departamentoId: 2 },

        // Chimaltenango
        { nombre: 'Acatenango', departamentoId: 3 },
        { nombre: 'Chimaltenango', departamentoId: 3 },
        { nombre: 'El Tejar', departamentoId: 3 },
        { nombre: 'Parramos', departamentoId: 3 },
        { nombre: 'Patzicía', departamentoId: 3 },
        { nombre: 'Patzún', departamentoId: 3 },
        { nombre: 'Pochuta', departamentoId: 3 },
        { nombre: 'San Andrés Itzapa', departamentoId: 3 },
        { nombre: 'San José Poaquíl', departamentoId: 3 },
        { nombre: 'San Juan Comalapa', departamentoId: 3 },
        { nombre: 'San Martín Jilotepeque', departamentoId: 3 },
        { nombre: 'Santa Apolonia', departamentoId: 3 },
        { nombre: 'Santa Cruz Balanyá', departamentoId: 3 },
        { nombre: 'Tecpán', departamentoId: 3 },
        { nombre: 'Yepocapa', departamentoId: 3 },
        { nombre: 'Zaragoza', departamentoId: 3 },

        // Chiquimula
        { nombre: 'Camotán', departamentoId: 4 },
        { nombre: 'Chiquimula', departamentoId: 4 },
        { nombre: 'Concepción Las Minas', departamentoId: 4 },
        { nombre: 'Esquipulas', departamentoId: 4 },
        { nombre: 'Ipala', departamentoId: 4 },
        { nombre: 'Jocotán', departamentoId: 4 },
        { nombre: 'Olopa', departamentoId: 4 },
        { nombre: 'Quezaltepeque', departamentoId: 4 },
        { nombre: 'San Jacinto', departamentoId: 4 },
        { nombre: 'San José la Arada', departamentoId: 4 },
        { nombre: 'San Juan Ermita', departamentoId: 4 },

        // El Progreso
        { nombre: 'El Jícaro', departamentoId: 5 },
        { nombre: 'Guastatoya', departamentoId: 5 },
        { nombre: 'Morazán', departamentoId: 5 },
        { nombre: 'San Agustín Acasaguastlán', departamentoId: 5 },
        { nombre: 'San Antonio La Paz', departamentoId: 5 },
        { nombre: 'San Cristóbal Acasaguastlán', departamentoId: 5 },
        { nombre: 'Sanarate', departamentoId: 5 },
        { nombre: 'Sansare', departamentoId: 5 },

        // Escuintla
        { nombre: 'Escuintla', departamentoId: 6 },
        { nombre: 'Guanagazapa', departamentoId: 6 },
        { nombre: 'Iztapa', departamentoId: 6 },
        { nombre: 'La Democracia', departamentoId: 6 },
        { nombre: 'La Gomera', departamentoId: 6 },
        { nombre: 'Masagua', departamentoId: 6 },
        { nombre: 'Nueva Concepción', departamentoId: 6 },
        { nombre: 'Palín', departamentoId: 6 },
        { nombre: 'San José', departamentoId: 6 },
        { nombre: 'San Vicente Pacaya', departamentoId: 6 },
        { nombre: 'Santa Lucía Cotzumalguapa', departamentoId: 6 },
        { nombre: 'Siquinalá', departamentoId: 6 },
        { nombre: 'Tiquisate', departamentoId: 6 },

        // Guatemala
        { nombre: 'Amatitlán', departamentoId: 7 },
        { nombre: 'Chinautla', departamentoId: 7 },
        { nombre: 'Chuarrancho', departamentoId: 7 },
        { nombre: 'Guatemala', departamentoId: 7 },
        { nombre: 'Fraijanes', departamentoId: 7 },
        { nombre: 'Mixco', departamentoId: 7 },
        { nombre: 'Palencia', departamentoId: 7 },
        { nombre: 'San José del Golfo', departamentoId: 7 },
        { nombre: 'San José Pinula', departamentoId: 7 },
        { nombre: 'San Juan Sacatepéquez', departamentoId: 7 },
        { nombre: 'San Miguel Petapa', departamentoId: 7 },
        { nombre: 'San Pedro Ayampuc', departamentoId: 7 },
        { nombre: 'San Pedro Sacatepéquez', departamentoId: 7 },
        { nombre: 'San Raymundo', departamentoId: 7 },
        { nombre: 'Santa Catarina Pinula', departamentoId: 7 },
        { nombre: 'Villa Canales', departamentoId: 7 },
        { nombre: 'Villa Nueva', departamentoId: 7 },
        //
        { nombre: 'Aguacatán', departamentoId: 8 },
        { nombre: 'Chiantla', departamentoId: 8 },
        { nombre: 'Colotenango', departamentoId: 8 },
        { nombre: 'Concepción Huista', departamentoId: 8 },
        { nombre: 'Cuilco', departamentoId: 8 },
        { nombre: 'Huehuetenango', departamentoId: 8 },
        { nombre: 'Jacaltenango', departamentoId: 8 },
        { nombre: 'La Democracia', departamentoId: 8 },
        { nombre: 'La Libertad', departamentoId: 8 },
        { nombre: 'Malacatancito', departamentoId: 8 },
        { nombre: 'Nentón', departamentoId: 8 },
        { nombre: 'San Antonio Huista', departamentoId: 8 },
        { nombre: 'San Gaspar Ixchil', departamentoId: 8 },
        { nombre: 'San Ildefonso Ixtahuacán', departamentoId: 8 },
        { nombre: 'San Juan Atitán', departamentoId: 8 },
        { nombre: 'San Juan Ixcoy', departamentoId: 8 },
        { nombre: 'San Mateo Ixtatán', departamentoId: 8 },
        { nombre: 'San Miguel Acatán', departamentoId: 8 },
        { nombre: 'San Pedro Nécta', departamentoId: 8 },
        { nombre: 'San Pedro Soloma', departamentoId: 8 },
        { nombre: 'San Rafael La Independencia', departamentoId: 8 },
        { nombre: 'San Rafael Pétzal', departamentoId: 8 },
        { nombre: 'San Sebastián Coatán', departamentoId: 8 },
        { nombre: 'San Sebastián Huehuetenango', departamentoId: 8 },
        { nombre: 'Santa Ana Huista', departamentoId: 8 },
        { nombre: 'Santa Bárbara', departamentoId: 8 },
        { nombre: 'Santa Cruz Barillas', departamentoId: 8 },
        { nombre: 'Santa Eulalia', departamentoId: 8 },
        { nombre: 'Santiago Chimaltenango', departamentoId: 8 },
        { nombre: 'Tectitán', departamentoId: 8 },
        { nombre: 'Todos Santos Cuchumatán', departamentoId: 8 },
        { nombre: 'Unión Cantinil', departamentoId: 8 },

        // Izabal
        { nombre: 'El Estor', departamentoId: 9 },
        { nombre: 'Livingston', departamentoId: 9 },
        { nombre: 'Los Amates', departamentoId: 9 },
        { nombre: 'Morales', departamentoId: 9 },
        { nombre: 'Puerto Barrios', departamentoId: 9 },

        // Jalapa
        { nombre: 'Jalapa', departamentoId: 10 },
        { nombre: 'Mataquescuintla', departamentoId: 10 },
        { nombre: 'Monjas', departamentoId: 10 },
        { nombre: 'San Carlos Alzatate', departamentoId: 10 },
        { nombre: 'San Luis Jilotepeque', departamentoId: 10 },
        { nombre: 'San Manuel Chaparrón', departamentoId: 10 },
        { nombre: 'San Pedro Pinula', departamentoId: 10 },

        // Jutiapa
        { nombre: 'Agua Blanca', departamentoId: 11 },
        { nombre: 'Asunción Mita', departamentoId: 11 },
        { nombre: 'Atescatempa', departamentoId: 11 },
        { nombre: 'Comapa', departamentoId: 11 },
        { nombre: 'Conguaco', departamentoId: 11 },
        { nombre: 'El Adelanto', departamentoId: 11 },
        { nombre: 'El Progreso', departamentoId: 11 },
        { nombre: 'Jalpatagua', departamentoId: 11 },
        { nombre: 'Jerez', departamentoId: 11 },
        { nombre: 'Jutiapa', departamentoId: 11 },
        { nombre: 'Moyuta', departamentoId: 11 },
        { nombre: 'Pasaco', departamentoId: 11 },
        { nombre: 'Quesada', departamentoId: 11 },
        { nombre: 'San José Acatempa', departamentoId: 11 },
        { nombre: 'Santa Catarina Mita', departamentoId: 11 },
        { nombre: 'Yupiltepeque', departamentoId: 11 },
        { nombre: 'Zapotitlán', departamentoId: 11 },

        // Petén
        { nombre: 'Dolores', departamentoId: 12 },
        { nombre: 'El Chal', departamentoId: 12 },
        { nombre: 'Ciudad Flores', departamentoId: 12 },
        { nombre: 'La Libertad', departamentoId: 12 },
        { nombre: 'Las Cruces', departamentoId: 12 },
        { nombre: 'Melchor de Mencos', departamentoId: 12 },
        { nombre: 'Poptún', departamentoId: 12 },
        { nombre: 'San Andrés', departamentoId: 12 },
        { nombre: 'San Benito', departamentoId: 12 },
        { nombre: 'San Francisco', departamentoId: 12 },
        { nombre: 'San José', departamentoId: 12 },
        { nombre: 'San Luis', departamentoId: 12 },
        { nombre: 'Santa Ana', departamentoId: 12 },
        { nombre: 'Sayaxché', departamentoId: 12 },

        // Quetzaltenango
        { nombre: 'Almolonga', departamentoId: 13 },
        { nombre: 'Cabricán', departamentoId: 13 },
        { nombre: 'Cajolá', departamentoId: 13 },
        { nombre: 'Cantel', departamentoId: 13 },
        { nombre: 'Coatepeque', departamentoId: 13 },
        { nombre: 'Colomba Costa Cuca', departamentoId: 13 },
        { nombre: 'Concepción Chiquirichapa', departamentoId: 13 },
        { nombre: 'El Palmar', departamentoId: 13 },
        { nombre: 'Flores Costa Cuca', departamentoId: 13 },
        { nombre: 'Génova', departamentoId: 13 },
        { nombre: 'Huitán', departamentoId: 13 },
        { nombre: 'La Esperanza', departamentoId: 13 },
        { nombre: 'Olintepeque', departamentoId: 13 },
        { nombre: 'Palestina de Los Altos', departamentoId: 13 },
        { nombre: 'Quetzaltenango', departamentoId: 13 },
        { nombre: 'Salcajá', departamentoId: 13 },
        { nombre: 'San Carlos Sija', departamentoId: 13 },
        { nombre: 'San Francisco La Unión', departamentoId: 13 },
        { nombre: 'San Juan Ostuncalco', departamentoId: 13 },
        { nombre: 'San Martín Sacatepéquez', departamentoId: 13 },
        { nombre: 'San Mateo', departamentoId: 13 },
        { nombre: 'San Miguel Sigüilá', departamentoId: 13 },
        { nombre: 'Sibilia', departamentoId: 13 },
        { nombre: 'Zunil', departamentoId: 13 },

        // Quiché
        { nombre: 'Canillá', departamentoId: 14 },
        { nombre: 'Chajul', departamentoId: 14 },
        { nombre: 'Chicamán', departamentoId: 14 },
        { nombre: 'Chiché', departamentoId: 14 },
        { nombre: 'Chichicastenango', departamentoId: 14 },
        { nombre: 'Chinique', departamentoId: 14 },
        { nombre: 'Cunén', departamentoId: 14 },
        { nombre: 'Ixcán Playa Grande', departamentoId: 14 },
        { nombre: 'Joyabaj', departamentoId: 14 },
        { nombre: 'Nebaj', departamentoId: 14 },
        { nombre: 'Pachalum', departamentoId: 14 },
        { nombre: 'Patzité', departamentoId: 14 },
        { nombre: 'Sacapulas', departamentoId: 14 },
        { nombre: 'San Andrés Sajcabajá', departamentoId: 14 },
        { nombre: 'San Antonio Ilotenango', departamentoId: 14 },
        { nombre: 'San Bartolomé Jocotenango', departamentoId: 14 },
        { nombre: 'San Juan Cotzal', departamentoId: 14 },
        { nombre: 'San Pedro Jocopilas', departamentoId: 14 },
        { nombre: 'Santa Cruz del Quiché', departamentoId: 14 },
        { nombre: 'Uspantán', departamentoId: 14 },
        { nombre: 'Zacualpa', departamentoId: 14 },

        // Retalhuleu
        { nombre: 'Champerico', departamentoId: 15 },
        { nombre: 'El Asintal', departamentoId: 15 },
        { nombre: 'Nuevo San Carlos', departamentoId: 15 },
        { nombre: 'Retalhuleu', departamentoId: 15 },
        { nombre: 'San Andrés Villa Seca', departamentoId: 15 },
        { nombre: 'San Felipe Reu', departamentoId: 15 },
        { nombre: 'San Martín Zapotitlán', departamentoId: 15 },
        { nombre: 'San Sebastián', departamentoId: 15 },
        { nombre: 'Santa Cruz Muluá', departamentoId: 15 },

        // Sacatepéquez
        { nombre: 'Alotenango', departamentoId: 16 },
        { nombre: 'Ciudad Vieja', departamentoId: 16 },
        { nombre: 'Jocotenango', departamentoId: 16 },
        { nombre: 'Antigua Guatemala', departamentoId: 16 },
        { nombre: 'Magdalena Milpas Altas', departamentoId: 16 },
        { nombre: 'Pastores', departamentoId: 16 },
        { nombre: 'San Antonio Aguas Calientes', departamentoId: 16 },
        { nombre: 'San Bartolomé Milpas Altas', departamentoId: 16 },
        { nombre: 'San Lucas Sacatepéquez', departamentoId: 16 },
        { nombre: 'San Miguel Dueñas', departamentoId: 16 },
        { nombre: 'Santa Catarina Barahona', departamentoId: 16 },
        { nombre: 'Santa Lucía Milpas Altas', departamentoId: 16 },
        { nombre: 'Santa María de Jesús', departamentoId: 16 },
        { nombre: 'Santiago Sacatepéquez', departamentoId: 16 },
        { nombre: 'Santo Domingo Xenacoj', departamentoId: 16 },
        { nombre: 'Sumpango', departamentoId: 16 },

        // San Marcos
        { nombre: 'Ayutla', departamentoId: 17 },
        { nombre: 'Catarina', departamentoId: 17 },
        { nombre: 'Comitancillo', departamentoId: 17 },
        { nombre: 'Concepción Tutuapa', departamentoId: 17 },
        { nombre: 'El Quetzal', departamentoId: 17 },
        { nombre: 'El Tumbador', departamentoId: 17 },
        { nombre: 'Esquipulas Palo Gordo', departamentoId: 17 },
        { nombre: 'Ixchiguán', departamentoId: 17 },
        { nombre: 'La Blanca', departamentoId: 17 },
        { nombre: 'La Reforma', departamentoId: 17 },
        { nombre: 'Malacatán', departamentoId: 17 },
        { nombre: 'Nuevo Progreso', departamentoId: 17 },
        { nombre: 'Ocós', departamentoId: 17 },
        { nombre: 'Pajapita', departamentoId: 17 },
        { nombre: 'Río Blanco', departamentoId: 17 },
        { nombre: 'San Antonio Sacatepéquez', departamentoId: 17 },
        { nombre: 'San Cristóbal Cucho', departamentoId: 17 },
        { nombre: 'San José El Rodeo', departamentoId: 17 },
        { nombre: 'San José Ojetenam', departamentoId: 17 },
        { nombre: 'San Lorenzo', departamentoId: 17 },
        { nombre: 'San Marcos', departamentoId: 17 },
        { nombre: 'San Miguel Ixtahuacán', departamentoId: 17 },
        { nombre: 'San Pablo', departamentoId: 17 },
        { nombre: 'San Pedro Sacatepéquez', departamentoId: 17 },
        { nombre: 'San Rafael Pie de la Cuesta', departamentoId: 17 },
        { nombre: 'Sibinal', departamentoId: 17 },
        { nombre: 'Sipacapa', departamentoId: 17 },
        { nombre: 'Tacaná', departamentoId: 17 },
        { nombre: 'Tajumulco', departamentoId: 17 },
        { nombre: 'Tejutla', departamentoId: 17 },

        // Santa Rosa
        { nombre: 'Barberena', departamentoId: 18 },
        { nombre: 'Casillas', departamentoId: 18 },
        { nombre: 'Chiquimulilla', departamentoId: 18 },
        { nombre: 'Cuilapa', departamentoId: 18 },
        { nombre: 'Guazacapán', departamentoId: 18 },
        { nombre: 'Nueva Santa Rosa', departamentoId: 18 },
        { nombre: 'Oratorio', departamentoId: 18 },
        { nombre: 'Pueblo Nuevo Viñas', departamentoId: 18 },
        { nombre: 'San Juan Tecuaco', departamentoId: 18 },
        { nombre: 'San Rafael las Flores', departamentoId: 18 },
        { nombre: 'Santa Cruz Naranjo', departamentoId: 18 },
        { nombre: 'Santa María Ixhuatán', departamentoId: 18 },
        { nombre: 'Santa Rosa de Lima', departamentoId: 18 },
        { nombre: 'Taxisco', departamentoId: 18 },

        // Sololá
        { nombre: 'Concepción', departamentoId: 19 },
        { nombre: 'Nahualá', departamentoId: 19 },
        { nombre: 'Panajachel', departamentoId: 19 },
        { nombre: 'San Andrés Semetabaj', departamentoId: 19 },
        { nombre: 'San Antonio Palopó', departamentoId: 19 },
        { nombre: 'San José Chacayá', departamentoId: 19 },
        { nombre: 'San Juan La Laguna', departamentoId: 19 },
        { nombre: 'San Lucas Tolimán', departamentoId: 19 },
        { nombre: 'San Marcos La Laguna', departamentoId: 19 },
        { nombre: 'San Pablo La Laguna', departamentoId: 19 },
        { nombre: 'San Pedro La Laguna', departamentoId: 19 },
        { nombre: 'Santa Catarina Ixtahuacán', departamentoId: 19 },
        { nombre: 'Santa Catarina Palopó', departamentoId: 19 },
        { nombre: 'Santa Clara La Laguna', departamentoId: 19 },
        { nombre: 'Santa Cruz La Laguna', departamentoId: 19 },
        { nombre: 'Santa Lucía Utatlán', departamentoId: 19 },
        { nombre: 'Santa María Visitación', departamentoId: 19 },
        { nombre: 'Santiago Atitlán', departamentoId: 19 },
        { nombre: 'Sololá', departamentoId: 19 },

        // Suchitepéquez
        { nombre: 'Chicacao', departamentoId: 20 },
        { nombre: 'Cuyotenango', departamentoId: 20 },
        { nombre: 'Mazatenango', departamentoId: 20 },
        { nombre: 'Patulul', departamentoId: 20 },
        { nombre: 'Pueblo Nuevo', departamentoId: 20 },
        { nombre: 'Río Bravo', departamentoId: 20 },
        { nombre: 'Samayac', departamentoId: 20 },
        { nombre: 'San Antonio Suchitepéquez', departamentoId: 20 },
        { nombre: 'San Bernardino', departamentoId: 20 },
        { nombre: 'San Francisco Zapotitlán', departamentoId: 20 },
        { nombre: 'San Gabriel', departamentoId: 20 },
        { nombre: 'San José El Idolo', departamentoId: 20 },
        { nombre: 'San José La Maquina', departamentoId: 20 },
        { nombre: 'San Juan Bautista', departamentoId: 20 },
        { nombre: 'San Lorenzo', departamentoId: 20 },
        { nombre: 'San Miguel Panán', departamentoId: 20 },
        { nombre: 'San Pablo Jocopilas', departamentoId: 20 },
        { nombre: 'Santa Bárbara', departamentoId: 20 },
        { nombre: 'Santo Domingo Suchitepéquez', departamentoId: 20 },
        { nombre: 'Santo Tomás La Unión', departamentoId: 20 },
        { nombre: 'Zunilito', departamentoId: 20 },

        // Totonicapán
        { nombre: 'Momostenango', departamentoId: 21 },
        { nombre: 'San Andrés Xecul', departamentoId: 21 },
        { nombre: 'San Bartolo', departamentoId: 21 },
        { nombre: 'San Cristóbal Totonicapán', departamentoId: 21 },
        { nombre: 'San Francisco El Alto', departamentoId: 21 },
        { nombre: 'Santa Lucía La Reforma', departamentoId: 21 },
        { nombre: 'Santa María Chiquimula', departamentoId: 21 },
        { nombre: 'Totonicapán', departamentoId: 21 },

        // Zacapa
        { nombre: 'Cabañas', departamentoId: 22 },
        { nombre: 'Estanzuela', departamentoId: 22 },
        { nombre: 'Gualán', departamentoId: 22 },
        { nombre: 'Huité', departamentoId: 22 },
        { nombre: 'La Unión', departamentoId: 22 },
        { nombre: 'Río Hondo', departamentoId: 22 },
        { nombre: 'San Diego', departamentoId: 22 },
        { nombre: 'San Jorge', departamentoId: 22 },
        { nombre: 'Teculután', departamentoId: 22 },
        { nombre: 'Usumatlán', departamentoId: 22 },
        { nombre: 'Zacapa', departamentoId: 22 },
      ];

      const insertedMunicipios = await this.prisma.municipio.createMany({
        data: municipios,
        skipDuplicates: true,
      });

      return {
        message: 'Municipios de Huehuetenango insertados correctamente',
        insertedCount: insertedMunicipios.count,
      };
    } catch (error) {
      console.error('Error al insertar municipios de Huehuetenango:', error);
      throw new Error(
        'No se pudieron insertar los municipios de Huehuetenango',
      );
    }
  }
}
