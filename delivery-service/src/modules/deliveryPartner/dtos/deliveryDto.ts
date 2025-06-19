import { IsNotEmpty, IsNumber } from "class-validator";

export class DeliveryDto{

    @IsNotEmpty()
    page: number;

    @IsNotEmpty()
    limit: number;
}