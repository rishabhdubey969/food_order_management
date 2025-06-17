import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";

export const Roles = (roles) => SetMetadata('roles', roles);

export const AccessRoleDecorator = (accessRole) => SetMetadata('accessRole', accessRole);

export const CurrentPartner = createParamDecorator((data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    console.log(request.sub);
    return request.sub;
})