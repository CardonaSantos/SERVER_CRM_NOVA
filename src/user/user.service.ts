import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminUpdateUserDto } from './dto/AdminUpdate.dto';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.usuario.create({
          data: {
            contrasena: createUserDto.contrasena,
            correo: createUserDto.correo,
            nombre: createUserDto.nombre,
            rol: createUserDto.rol,
            activo: true,
            empresaId: createUserDto.empresaId,
          },
        });

        if (!newUser) {
          throw new InternalServerErrorException('Error al crear usuario');
        }

        return newUser;
      });
    } catch (error) {
      console.error('Error en la transacción:', error);

      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException('No se pudo crear el usuario');
      }

      throw new BadRequestException('Error inesperado');
    }
  }

  async findByGmail(correo: string) {
    console.log('Al find by email debería llegar el coreo: ', correo);

    try {
      const user = await this.prisma.usuario.findFirst({
        where: {
          correo: correo,
        },
        include: {
          empresa: {
            select: {
              id: true,
            },
          },
        },
      });

      console.log('El usuario encontrado es: ', user);

      if (!user) {
        throw new InternalServerErrorException('Error');
      }

      return user;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('error al encontrar usuario');
    }
  }

  async findAll(userAuth: UserTokenAuth) {
    return this.prisma.usuario.findMany({});
  }

  async getUsersToCreateTickets() {
    try {
      const tecs = await this.prisma.usuario.findMany({
        // where: {
        //   rol: 'TECNICO'
        // }
        select: {
          id: true,
          nombre: true,
        },
      });
      return tecs;
    } catch (error) {
      console.log(error);
    }
  }

  async getUserByRole() {
    try {
      const user = await this.prisma.usuario.findMany({
        select: {
          id: true,
          nombre: true,
          correo: true,
          telefono: true,
          rol: true,
        },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const dataUsers = user.map((user) => ({
        id: user.id,
        nombre: user.nombre,
        apellidos: user.nombre,
        email: user.correo,
        telefono: user.telefono,
        rol: user.rol,
      }));
      return dataUsers;
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
      throw new Error('Error al obtener el usuario');
    }
  }

  async getTecnicosToTicket() {
    try {
      const tecs = await this.prisma.usuario.findMany({
        where: {
          rol: 'TECNICO',
        },
        select: {
          id: true,
          nombre: true,
        },
      });
      return tecs;
    } catch (error) {
      console.log(error);
    }
  }

  async setSaldo0(id: number) {
    try {
      const setSaldo = await this.prisma.saldoCliente.update({
        where: {
          id: id,
        },
        data: {
          saldoFavor: {
            set: 0,
          },
          saldoPendiente: {
            set: 0,
          },
          totalPagos: 0,
          ultimoPago: null,
        },
      });
    } catch (error) {}
  }
}
