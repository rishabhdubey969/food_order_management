import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private readonly jwtService: JwtService){}
  async canActivate(
    context: ExecutionContext,
  ){
        const request = context.switchToHttp().getRequest();

        const accessToken = request.headers.authorization?.split(' ')[1];

        if(!accessToken)
        {
          throw new UnauthorizedException("Login Again!!");
        }

        try{
          const payload = await this.jwtService.verify(accessToken);
          request.payload = payload;
          return true;
        }catch(err){
          throw new UnauthorizedException("Invalid Token");
        }
  }
}
