import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    console.log('inside decorator');
    const request = ctx.switchToHttp().getRequest();
    //   console.log(request)
    return field ? request.user?.[field] : request.user;
  },
);
