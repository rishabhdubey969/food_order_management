import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateComplaintDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;


  @IsNotEmpty()
  @IsMongoId()
  orderId: string;

  @IsNotEmpty()
  description: string;
}
