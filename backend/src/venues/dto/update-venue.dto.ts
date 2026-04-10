import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, MaxLength, MinLength } from 'class-validator';
import { ScreenType } from '@prisma/client';

export class UpdateVenueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
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
