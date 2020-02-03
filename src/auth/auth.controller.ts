import { Body, Controller, Post } from '@nestjs/common';

import { LoginDto, RefreshTokenDto, RegisterDto } from './dto';
import { UserService } from '../user/user.service';
import { UserRO } from '../user/user.interface';
import { ForgetPasswordDto } from './dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerData: RegisterDto) {
    return await this.userService.create(registerData);
  }

  @Post('login')
  async login(@Body() loginData: LoginDto): Promise<UserRO> {
    return await this.userService.login(loginData);
  }

  @Post('forget-password')
  async forgetPassword(@Body() forgetPasswordData: ForgetPasswordDto) {
    return await this.userService.forgetPassword(forgetPasswordData);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordData: ResetPasswordDto) {
    return await this.userService.resetPassword(resetPasswordData);
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenData: RefreshTokenDto) {
    return await this.userService.refreshToken(refreshTokenData);
  }
}
