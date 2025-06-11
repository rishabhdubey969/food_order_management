
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from 'src/modules/token/token.service';


@Injectable()
export class OtpVerifiedGuard implements CanActivate {

  constructor(
    private readonly tokenService: TokenService
  ){}

  async canActivate(
    context: ExecutionContext,
  ){
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers.authorization?.split(' ')[1];
    if(!accessToken){
      throw new UnauthorizedException('Timeout!!');
    }

    try{
        const payload = await this.tokenService.verify(accessToken);
        const { partnerEmail, isVerified } = payload;
        
        if(!isVerified){
            return false;
        }
        request['sub'] = partnerEmail;

    }catch(err){
      throw new UnauthorizedException('Login Again!!')
    }
    return true;
  } 
}
