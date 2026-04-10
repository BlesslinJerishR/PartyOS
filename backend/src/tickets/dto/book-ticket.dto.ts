import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class BookTicketDto {
  @IsUUID()
  showId: string;

  @IsUUID()
  seatId: string;

  @IsString()
  @MaxLength(128)
  @IsOptional()
  password?: string;
}
