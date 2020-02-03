import { Body, Controller, Post } from '@nestjs/common';

import { LoginDto, RegisterDto } from './dto';
import { UserService } from '../user/user.service';
import { UserRO } from '../user/user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerData: RegisterDto) {
    return await this.userService.create(registerData);
  }

  @Post('login')
  async login(@Body() loginData: LoginDto): Promise<UserRO> {
    const user = await this.userService.findOne(loginData);
    const token = await this.userService.generateJWT(user);
    const { username, ...rest } = user;
    const userData = { username, token };

    return {
      data: {
        user: userData,
        message: 'Successfully logged in.',
      },
    };
  }
}
