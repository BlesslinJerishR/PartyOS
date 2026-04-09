import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSnackDto {
  @IsString()
  @IsOptional()
  name?: string;

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
