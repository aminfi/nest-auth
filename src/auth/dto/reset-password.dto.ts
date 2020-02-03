import { IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  forgetPasswordToken: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  newPassword: string;
}
