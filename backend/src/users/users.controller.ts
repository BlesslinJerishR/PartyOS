import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { SetRoleDto } from './dto/set-role.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('role')
  setRole(@CurrentUser('id') userId: string, @Body() dto: SetRoleDto) {
    return this.usersService.setRole(userId, dto.role);
  }

  @Patch('location')
  updateLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.usersService.updateLocation(
      userId,
      dto.latitude,
      dto.longitude,
    );
  }

  @Get('nearby-hosts')
  getNearbyHosts(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Valid latitude and longitude are required');
    }
    const r = radius ? parseFloat(radius) : undefined;
    if (r !== undefined && (isNaN(r) || r <= 0 || r > 500)) {
      throw new BadRequestException('Radius must be between 0 and 500 km');
    }
    return this.usersService.getNearbyHosts(lat, lng, r);
  }

  @Get('search-hosts')
  searchHosts(@Query('q') query: string) {
    const q = (query || '').trim().slice(0, 50);
    return this.usersService.searchHosts(q);
  }
}
