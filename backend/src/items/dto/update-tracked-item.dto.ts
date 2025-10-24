import { IsOptional, IsNumber, IsString, IsBoolean, IsIn } from 'class-validator';

export class UpdateTrackedItemDto {
  @IsOptional()
  @IsNumber()
  targetPrice?: number;

  @IsOptional()
  @IsBoolean()
  isTracking?: boolean;

  @IsOptional()
  @IsIn(['tracking', 'paused', 'purchased'])
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
