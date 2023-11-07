import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/shared/repository/user.repository';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(UserRepository) private readonly userDB: UserRepository,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}
  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest();
      const token = request.cookies.access_token;
      if (!token) {
        throw new UnauthorizedException('you are not authenticated');
      }
      const secret = this.config.get('JWT_SECRET');
      const decodedData: any = this.jwt.verify(token, { secret });
      const user = await this.userDB.findById(decodedData.id);
      if (!user) {
        throw new UnauthorizedException('Unauthorized');
      }
      request.user = user;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }

    return true;
  }
}
