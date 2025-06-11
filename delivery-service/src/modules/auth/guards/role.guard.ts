
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from 'src/modules/token/token.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {

  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector
  ){}

  async canActivate(
    context: ExecutionContext,
  ){
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers.authorization?.split(' ')[1];
    if(!accessToken){
      throw new UnauthorizedException('Login Again!!');
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [context.getHandler(), context.getClass()])

    try{
      const payload = await this.tokenService.verify(accessToken);
      const { role } = payload;

      return requiredRoles.some((Role) => Role === role)
      
    }catch(err){
      throw new UnauthorizedException('Login Again!!')
    }
    return true;
  } 
}
