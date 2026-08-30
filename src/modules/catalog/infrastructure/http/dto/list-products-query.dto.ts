import { Type } from 'class-transformer';
import { IsInt, IsNumberString, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListProductsQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 24;
}
