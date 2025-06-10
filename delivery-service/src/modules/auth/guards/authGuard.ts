import { access } from 'fs';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from 'src/modules/token/token.service';
import { AccessRole } from 'src/common/enums';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly tokenService: TokenService
  ){}
  async canActivate(
    context: ExecutionContext,
  ){
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers.authorization?.split(' ')[1];

    if(!accessToken){
      throw new UnauthorizedException("Login Again!!");
    }

    // const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [context.getHandler(), context.getClass()])

    // const requiredAccessRole = this.reflector.getAllAndOverride<string>("accessRole", [context.getHandler(), context.getClass()])

    try{
      const payload = await this.tokenService.verify(accessToken);
      const {userId, accessrole} = payload;

      if(accessrole !== AccessRole.AUTH){
        return false;
      }

      const user = {
        userId: userId
      }

      request.user = user;

    }catch(err){
      return false;
    }
    return true;
  }
}
