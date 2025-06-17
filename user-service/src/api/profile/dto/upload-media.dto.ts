import { IsObject, IsNotEmpty, IsString } from 'class-validator';

export class UploadMediaDto {
    
  @IsNotEmpty()
  @IsString()
  fileExtension: string;

  @IsNotEmpty()
  @IsString()
  contentType: string;
  
}
