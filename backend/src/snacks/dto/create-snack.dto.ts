import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID, MinLength, MaxLength, Min, Max } from 'class-validator';

export class CreateSnackDto {
  @IsUUID()
  venueId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(100000)
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  available?: boolean;
}
