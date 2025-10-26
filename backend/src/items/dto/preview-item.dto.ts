import { IsUrl } from 'class-validator';

export class PreviewItemDto {
  @IsUrl()
  productUrl: string;
}
