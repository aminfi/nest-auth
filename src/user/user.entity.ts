import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { InternalServerErrorException } from '@nestjs/common';
import { IsEmail } from 'class-validator';
import * as crypto from 'crypto';
import * as ms from 'ms';
import * as jwt from 'jsonwebtoken';
import { UserRO } from './user.interface';

export enum JwtType {
  ACCESS_TOKEN = 1,
  REFRESH_TOKEN = 2,
}

@Entity('user')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  username: string;

  @Column({ unique: true, nullable: false })
  @IsEmail()
  email: string;

  @Column({ default: '' })
  firstName: string;

  @Column({ default: '' })
  lastName: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  @Exclude()
  forgetPasswordToken: string;

  @Column({ nullable: true })
  @Exclude()
  forgetPasswordExpires: string;

  constructor(partial: Partial<UserEntity>) {
    super();
    Object.assign(this, partial);
  }

  @BeforeUpdate()
  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 12);
  }

  async comparePassword(attempt: string) {
    try {
      return await compare(attempt, this.password);
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  generateForgetPasswordToken() {
    this.forgetPasswordToken = crypto.randomBytes(20).toString('hex');
    this.forgetPasswordExpires =
      Date.now() + ms(process.env.FORGET_PASSWORD_EXPIRATION_TIME);
  }

  generateJWT(type: JwtType = JwtType.ACCESS_TOKEN) {
    return jwt.sign(
      {
        id: this.id,
        username: this.username,
        email: this.email,
      },
      process.env.SECRET,
      {
        expiresIn:
          type === JwtType.ACCESS_TOKEN
            ? process.env.ACCESS_TOKEN_EXIPRATION_TIME
            : process.env.REFRESH_TOKEN_EXIPRATION_TIME,
      },
    );
  }

  buildUserRO(message: string): UserRO {
    const userRO = {
      username: this.username,
      email: this.email,
      accessToken: this.generateJWT(JwtType.ACCESS_TOKEN),
      refreshToken: this.generateJWT(JwtType.REFRESH_TOKEN),
    };
    return { data: { user: userRO, message } };
  }
}
