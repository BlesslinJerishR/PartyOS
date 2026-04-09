import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SnacksService } from './snacks.service';
import { CreateSnackDto } from './dto/create-snack.dto';
import { UpdateSnackDto } from './dto/update-snack.dto';

@Controller('snacks')
@UseGuards(JwtAuthGuard)
export class SnacksController {
  constructor(private readonly snacksService: SnacksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSnackDto) {
    return this.snacksService.create(userId, dto);
  }

  @Get('venue/:venueId')
  findByVenue(@Param('venueId') venueId: string) {
    return this.snacksService.findByVenue(venueId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSnackDto,
  ) {
    return this.snacksService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.snacksService.remove(id, userId);
  }
}
