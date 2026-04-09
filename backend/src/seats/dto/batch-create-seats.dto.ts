import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSeatDto } from './create-seat.dto';

class SeatItem {
  type: any;
  label: string;
  row: number;
  col: number;
  capacity?: number;
}

export class BatchCreateSeatsDto {
  @IsString()
  venueId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatItem)
  seats: SeatItem[];
}
