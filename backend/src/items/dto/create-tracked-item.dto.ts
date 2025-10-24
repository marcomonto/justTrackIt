import { IsString, IsOptional, IsNumber, IsUrl, IsInt, IsBoolean } from 'class-validator';

export class CreateTrackedItemDto {
  @IsUrl()
  productUrl: string;

  @IsOptional()
  @IsInt()
  storeId?: number; // If not provided, will be auto-detected from URL

  @IsOptional()
  @IsNumber()
  targetPrice?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isTracking?: boolean;
}
