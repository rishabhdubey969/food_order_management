import { ApiProperty } from "@nestjs/swagger";

export class ErrorResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  errors?: string[];

  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  path: string;
}