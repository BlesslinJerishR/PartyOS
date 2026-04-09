import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  ticketId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
