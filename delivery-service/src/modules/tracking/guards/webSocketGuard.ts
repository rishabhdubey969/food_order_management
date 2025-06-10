
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from 'src/common/enums';
import { TokenService } from 'src/modules/token/token.service';

@Injectable()
export class WebSocketGuard implements CanActivate {

  constructor(
    private readonly tokenService: TokenService
  ){}

  async canActivate(
    context: ExecutionContext,
  ){

    const client = context.switchToWs().getClient();

    const accessToken = client.handshake.headers.authorization?.split(' ')[1];

    if(!accessToken){
      throw new UnauthorizedException('No Any Header!!!');
    }

    try{

      const payload = await this.tokenService.verify(accessToken);
      client.payload = payload;
      
    }catch(err){
      throw new UnauthorizedException('Login Again!!')
    }

    return true;
  } 
}
