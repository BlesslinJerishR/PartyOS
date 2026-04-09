import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
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
    return this.usersService.getNearbyHosts(
      parseFloat(latitude),
      parseFloat(longitude),
      radius ? parseFloat(radius) : undefined,
    );
  }
}
