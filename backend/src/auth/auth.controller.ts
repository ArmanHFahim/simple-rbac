import { Body, Controller, Get, Post } from '@nestjs/common';

import { zodPipe } from '@common/pipes';
import { AuthUser } from '@common/types';
import { CurrentUser, Public } from '@common/decorators';

import { LoginDto, RefreshTokenDto, loginSchema, refreshTokenSchema } from '@auth/dto/auth.dto';

import { AuthService } from '@auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  async login(@Body(zodPipe(loginSchema)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body(zodPipe(refreshTokenSchema)) dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.id);
  }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
