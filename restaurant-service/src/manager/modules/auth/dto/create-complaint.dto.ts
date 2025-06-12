// export class CreateComplaintDto {
//   userId: string;
//   orderId: string;
//   description: string;
// }
// src/manager/dto/create-complaint.dto.ts
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
