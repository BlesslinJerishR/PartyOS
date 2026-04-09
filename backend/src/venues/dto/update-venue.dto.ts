import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ScreenType } from '@prisma/client';

export class UpdateVenueDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsEnum(ScreenType)
  @IsOptional()
  screenType?: ScreenType;
}
