import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

export function throwNotFound(message: string): never {
  throw new NotFoundException({ success: false, message });
}

export function throwBadRequest(message: string): never {
  throw new BadRequestException({ success: false, message });
}

export function throwInternal(message: string): never {
  throw new InternalServerErrorException({ success: false, message });
}