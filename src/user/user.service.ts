import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';

import { UserEntity } from './user.entity';
import { LoginDto, RegisterDto } from '../auth/dto';
import { UserRO } from './user.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(registerData: RegisterDto): Promise<UserRO> {
    const { username, password } = registerData;
    const user = await this.userRepository.findOne({ where: { username } });

    if (user) {
      const errors = { username: 'Username must be unique.' };
      throw new HttpException(
        { data: { message: 'Input data validation failed', errors } },
        HttpStatus.BAD_REQUEST,
      );
    }

    const newUser = new UserEntity({
      username,
      password,
    });

    const savedUser = await this.userRepository.save(newUser);
    return this.buildUserRO(savedUser);
  }

  async findOne(loginData: LoginDto): Promise<UserEntity> {
    const { username, password } = loginData;
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user || !(await user.comparePassword(password))) {
      throw new HttpException(
        {
          data: {
            message: 'Invalid username/password',
            errors: ['Invalid username/password'],
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  public generateJWT(user: UserEntity) {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        exp: exp.getTime() / 1000,
      },
      process.env.SECRET,
    );
  }

  private buildUserRO(user: UserEntity): UserRO {
    const userRO = {
      username: user.username,
      password: user.password,
      token: this.generateJWT(user),
    };

    return { data: { user: userRO, message: 'User created successfully.' } };
  }
}
