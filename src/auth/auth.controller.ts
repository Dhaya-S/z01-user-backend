import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOtp(@Body() body: any) {
    const data = await this.authService.sendOtp(body);
    return { success: true, data };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: any) {
    const data = await this.authService.verifyOtp(body);
    return { success: true, data };
  }

  @Post('google')
  async googleLogin(@Body() body: any) {
    const data = await this.authService.googleLogin(body);
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

  @Post('update-location')
  async updateLocation(@Body() body: any) {
    const data = await this.authService.updateLocation(body);
    return { success: true, data };
  }
}
