import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuItemDto } from './createMenuItem.dto';

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
