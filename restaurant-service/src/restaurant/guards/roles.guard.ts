// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RestaurantService } from '../restaurant.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly restaurantService: RestaurantService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const  restaurantId = request.params.restaurantId;

    if(user.roles!='manager'){
        throw new ForbiddenException('Only managers can access this route.');
    }

    const actualRestaurantId = await this.restaurantService.getRestaurantByManagerId(user.id);

    if(actualRestaurantId!=restaurantId){
        throw new ForbiddenException('You do not have access to this restaurant.');
    }

    return true;
  }
}
