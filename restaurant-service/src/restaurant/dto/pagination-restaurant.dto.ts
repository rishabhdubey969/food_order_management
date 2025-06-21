// src/restaurant/dtos/paginated-restaurants.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../schema/restaurant.schema'; // Import your Restaurant schema class

export class PaginatedRestaurantsDto {
  @ApiProperty({
    description: 'Array of restaurant objects for the current page.',
    type: [Restaurant], // This tells Swagger it's an array of Restaurant objects
  })
  data: Restaurant[];

  @ApiProperty({
    description: 'Total number of restaurants matching the criteria.',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'The maximum number of items returned per page.',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'The number of items skipped from the beginning.',
    example: 0,
  })
  offset: number;
}