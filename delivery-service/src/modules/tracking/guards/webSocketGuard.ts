
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from 'src/modules/token/token.service';


@Injectable()
export class WebSocketGuard implements CanActivate {

  constructor(
    private readonly tokenService: TokenService
  ){}

  async canActivate(
    context: ExecutionContext,
  ){
    console.log('🛡 WebSocketGuard: canActivate called');
    const client = context.switchToWs().getClient();

    const accessToken = client.handshake.headers.authorization?.split(' ')[1];

    if(!accessToken){
      throw new UnauthorizedException('No Any Header!!!');
    }

    try{
      console.log(accessToken)
      const payload = await this.tokenService.verify(accessToken);
      console.log(payload);
      client["payload"] = payload;
      console.log(`Client connected: ${client.id}`)
    }catch(err){
      throw new UnauthorizedException('Login Again!!')
    }

    return true;
  } 
}
