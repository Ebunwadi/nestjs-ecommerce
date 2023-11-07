// import {
//   Inject,
//   Injectable,
//   NestMiddleware,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { JwtService } from '@nestjs/jwt';
// import { NextFunction, Request, Response } from 'express';
// import { UserRepository } from 'src/shared/repository/user.repository';

// @Injectable()
// export class AuthMiddleware implements NestMiddleware {
//   constructor(
//     @Inject(UserRepository) private readonly userDB: UserRepository,
//     @Inject(JwtService) private readonly jwt: JwtService,
//     @Inject(ConfigService) private readonly config: ConfigService,
//   ) {}

//   async use(req: Request | any, res: Response, next: NextFunction) {
//     try {
//       const token = req.cookies.access_token;
//       if (!token) {
//         throw new UnauthorizedException('Missing auth token');
//       }
//       const secret = this.config.get('JWT_SECRET');
//       const decodedData = this.jwt.verify(token, { secret });
//       const user = await this.userDB.findById(decodedData.id);
//       if (!user) {
//         throw new UnauthorizedException('Unauthorized');
//       }
//       user.password = undefined;
//       req.user = user;
//       next();
//     } catch (error) {
//       console.log(error);

//       throw new UnauthorizedException(error);
//     }
//   }
// }
