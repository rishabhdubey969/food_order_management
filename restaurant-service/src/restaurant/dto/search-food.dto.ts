import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class SearchFoodDto {
  @IsString({ message: 'Search query must be a string.' })
  @IsNotEmpty({ message: 'Search query cannot be empty.' })
  @MinLength(2, { message: 'Search query must be at least 2 characters long.' }) 
  @MaxLength(100, { message: 'Search query cannot exceed 100 characters.' }) 
  @Matches(/^[a-zA-Z0-9\s-]+$/, { message: 'Search query contains invalid characters.' })
  q: string;
}