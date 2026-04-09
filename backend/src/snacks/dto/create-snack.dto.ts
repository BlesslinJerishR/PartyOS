import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateSnackDto {
  @IsString()
  venueId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  available?: boolean;
}
