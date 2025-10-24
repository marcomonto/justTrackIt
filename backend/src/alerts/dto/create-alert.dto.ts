import { IsString, IsOptional, IsNumber, IsIn, Min, Max, IsInt } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  itemId: string;

  @IsString()
  @IsIn(['price_drop', 'target_reached', 'percentage_drop', 'back_in_stock'])
  type: string;

  @IsOptional()
  @IsNumber()
  triggerPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  percentageDrop?: number;
}
