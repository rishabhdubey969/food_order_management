import { IsNotEmpty, IsNumber } from "class-validator";

export class DeliveryDto{

    @IsNumber()
    @IsNotEmpty()
    page: number;

    @IsNumber()
    @IsNotEmpty()
    limit: number;
}