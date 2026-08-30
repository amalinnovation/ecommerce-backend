import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

class AnalyticsEventDto {
  @IsString()
  @Matches(/^[a-z0-9_.]+$/, { message: 'eventType debe ser minúsculas/números/./_ , igual que el check de la DB' })
  eventType!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

export class IngestEventsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventDto)
  events!: AnalyticsEventDto[];
}
