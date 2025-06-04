import { PartialType } from "@nestjs/swagger";
import { CouponDto } from "./coupon.dto";

export class UpdateCoponDto extends PartialType(CouponDto) {}