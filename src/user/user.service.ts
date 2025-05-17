import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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

  async findUserInfo(id: number) {
    try {
      console.log('el id es: ', id);

      if (!id) {
        throw new NotFoundException('Error id no disponible');
      }
      const usuario = await this.prisma.usuario.findUnique({
        where: {
          id: id,
        },
      });

      console.log('el suuario es: ', usuario);

      return usuario;
    } catch (error) {
      console.log(error);
    }
  }

  async getUsersToProfileConfig() {
    try {
      const users = await this.prisma.usuario.findMany({
        select: {
          id: true,
          nombre: true,
          telefono: true,
          activo: true,
          actualizadoEn: true,
          creadoEn: true,
          correo: true,
          rol: true,
        },
      });

      if (!users) {
        throw new NotFoundException('Error al conseguir clientes');
      }

      return users;
    } catch (error) {
      console.log(error);
    }
  }

  async updateUser(id: number, data: UpdateUserDto) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (data.contrasena) {
      const salt = await bcrypt.genSalt(10);
      data.contrasena = await bcrypt.hash(data.contrasena, salt);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
    });
  }

  async updateOneUser(id: number, updateUserDto: UpdateUserDto) {
    const userExist = await this.prisma.usuario.findUnique({ where: { id } });
    if (!userExist)
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);

    if (updateUserDto.contrasena) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.contrasena = await bcrypt.hash(
        updateUserDto.contrasena,
        salt,
      );
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { id },
      data: updateUserDto,
    });

    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    const userExist = await this.prisma.usuario.findUnique({ where: { id } });
    if (!userExist) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    await this.prisma.usuario.delete({ where: { id } });
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
