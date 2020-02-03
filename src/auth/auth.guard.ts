import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import * as jwt from 'jsonwebtoken';

import { UserService } from '../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(request) {
    const authHeaders = request.headers.authorization;
    if (authHeaders && (authHeaders as string).split(' ')[1]) {
      const token = (authHeaders as string).split(' ')[1];
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.SECRET);
      } catch (e) {
        this.unAuthorized();
      }
      const user = await this.userService.findById(decoded.id);

      if (!user) {
        this.unAuthorized();
      }
      request.user = user.data.user;
      return true;
    } else {
      this.unAuthorized();
    }
  }

  // TODO make an utility function across all app.
  private unAuthorized() {
    const errors = { username: 'No user were found.' };
    throw new HttpException(
      { data: { message: 'Token is not valid', errors } },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
