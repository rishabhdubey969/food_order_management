
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from 'src/modules/token/token.service';
import { RedisService } from 'src/modules/redis/redisService';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService
  ){}
  async canActivate(
    context: ExecutionContext,
  ){
    
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers.authorization?.split(' ')[1];

    if(!accessToken){
      throw new UnauthorizedException("No Access Token!!!");
    }
    
      const payload = await this.tokenService.verify(accessToken);
    
      const { partnerId } = payload;

      const isAvailable = await this.redisService.isKeyExists(`login-${partnerId}`);
      if(isAvailable === false){
        return false;
      }
      request['sub'] = partnerId;
    return true;
  }
}
