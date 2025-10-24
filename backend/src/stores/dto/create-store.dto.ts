import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  scrapeType?: string; // "html", "api", "custom"

  @IsOptional()
  @IsInt()
  @Min(1000)
  minDelayMs?: number;
}
