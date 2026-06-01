import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    const data = await this.authService.register(body);
    return { success: true, data };
  }

  @Post('login')
  async login(@Body() body: any) {
    const data = await this.authService.login(body);
    return { success: true, data };
  }

  @Post('kyc')
  async submitKyc(@Body() body: any) {
    const data = await this.authService.submitKyc(body);
    return { success: true, data };
  }

  @Post('update-profile')
  async updateProfile(@Body() body: any) {
    const data = await this.authService.updateProfile(body);
    return { success: true, data };
  }
}
