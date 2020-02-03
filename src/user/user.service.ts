import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import * as ms from 'ms';

import { UserEntity } from './user.entity';
import { ForgetPasswordDto, LoginDto, RegisterDto } from '../auth/dto';
import { UserRO } from './user.interface';
import { ResetPasswordDto } from '../auth/dto/reset-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(registerData: RegisterDto): Promise<UserRO> {
    const { username, email, password } = registerData;
    const user = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (user) {
      const errors = { username: 'Username and Email must be unique.' };
      throw new HttpException(
        { data: { message: 'Input data validation failed', errors } },
        HttpStatus.BAD_REQUEST,
      );
    }

    const newUser = new UserEntity({
      username,
      email,
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

  async forgetPassword(forgetPasswordData: ForgetPasswordDto) {
    const { username } = forgetPasswordData;
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      this.noUserWereFound();
    }
    const userToUpdate = await this.userRepository.findOne({
      where: { id: user.id },
    });
    userToUpdate.generateForgetPasswordToken();
    try {
      const userData = await userToUpdate.save();
      return {
        data: {
          forgetPasswordToken: userData.forgetPasswordToken,
          message: 'Email with instructions to reset password has been sent.',
        },
      };
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async resetPassword(resetPasswordData: ResetPasswordDto) {
    const { newPassword, forgetPasswordToken, username } = resetPasswordData;

    const user = await this.userRepository.findOne({
      where: { forgetPasswordToken, username },
    });

    if (!user) {
      this.noUserWereFound();
    }
    user.password = newPassword;
    await user.save();
  }

  public generateJWT(user: UserEntity) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        exp: ms(process.env.ACCESS_TOKEN_EXIPRATION_TIME),
      },
      process.env.SECRET,
    );
  }

  private buildUserRO(user: UserEntity): UserRO {
    const { username, email } = user;
    const userRO = {
      username,
      email,
      token: this.generateJWT(user),
    };

    return { data: { user: userRO, message: 'User created successfully.' } };
  }

  private noUserWereFound() {
    const errors = { username: 'No user were found.' };
    throw new HttpException(
      { data: { message: 'Input data validation failed', errors } },
      HttpStatus.BAD_REQUEST,
    );
  }
}
