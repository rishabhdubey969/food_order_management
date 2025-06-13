import { IsOptional, IsNumber, Min, IsIn } from 'class-validator';

export class ListUsersDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 10;
  @IsOptional()
  @IsIn(['users', 'admin','manager']) // Now accepts string values
  role?: string;
}