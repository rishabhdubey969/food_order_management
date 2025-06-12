
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from 'src/modules/token/token.service';
import { AccessRole } from 'src/common/enums';

@Injectable()
export class ForgetPasswordGuard implements CanActivate {

  constructor(
    private readonly tokenService: TokenService
  ){}

  async canActivate(
    context: ExecutionContext,
  ){
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers.authorization?.split(' ')[1];
    if(!accessToken){
      throw new UnauthorizedException('Login Again!!');
    }

    try{
      const payload = await this.tokenService.verify(accessToken);
      const { partnerEmail } = payload;

      request['sub'] = partnerEmail;
      
    }catch(err){
      throw new UnauthorizedException('Login Again!!')
    }
    return true;
  } 
}
