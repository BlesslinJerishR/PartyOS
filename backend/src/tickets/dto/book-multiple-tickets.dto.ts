import { IsString, IsOptional, IsUUID, IsArray, ArrayMinSize, MaxLength } from 'class-validator';

export class BookMultipleTicketsDto {
  @IsUUID()
  showId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  seatIds: string[];

  @IsString()
  @MaxLength(128)
  @IsOptional()
  password?: string;
}
