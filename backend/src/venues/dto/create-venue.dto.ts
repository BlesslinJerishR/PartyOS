import { IsString, IsNumber, IsEnum, Min, Max, MaxLength, MinLength } from 'class-validator';
import { ScreenType } from '@prisma/client';

export class CreateVenueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
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
