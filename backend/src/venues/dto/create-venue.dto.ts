import { IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ScreenType } from '@prisma/client';

export class CreateVenueDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsEnum(ScreenType)
  screenType: ScreenType;
}
