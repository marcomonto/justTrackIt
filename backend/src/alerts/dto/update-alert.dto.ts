import { IsOptional, IsBoolean, IsNumber, IsInt, Min, Max } from 'class-validator';

export class UpdateAlertDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  triggerPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  percentageDrop?: number;
}
