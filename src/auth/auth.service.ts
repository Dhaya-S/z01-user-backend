import { Injectable, Inject, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';
import axios from 'axios';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
    private readonly notificationsService: NotificationsService
  ) {}

  normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    return digits.slice(-10);
  }

  async sendOtp(body: any) {
    const { mobile } = body;
    if (!mobile) throw new BadRequestException('Mobile number is required');
    const phone = this.normalizePhone(mobile);

    try {
      const response = await axios.post(
        "https://www.fast2sms.com/dev/otp/send",
        {
          mobile: phone,
          otp_id: process.env.FAST2SMS_OTP_ID,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            "Content-Type": "application/json",
            accept: "application/json",
          },
        },
      );

      console.log("FAST2SMS SEND:", response.data);

      if (!response.data.request_id) {
        throw new UnauthorizedException("OTP send failed");
      }

      const requestId = response.data.request_id;

      // Delete existing sessions for this phone
      await this.pool.query('DELETE FROM otps WHERE phone = $1', [phone]);

      // Create new session
      await this.pool.query(
        'INSERT INTO otps (phone, session_id, created_at) VALUES ($1, $2, NOW())',
        [phone, requestId]
      );

      return {
        success: true,
        requestId,
      };
    } catch (e: any) {
      console.log(e.response?.data || e.message);
      throw new InternalServerErrorException("Failed to send OTP");
    }
  }

  async verifyOtp(body: any) {
    const { mobile, otp, user_type = 'customer', required_role } = body;
    if (!mobile || !otp) throw new BadRequestException('Mobile and OTP are required');
    
    const phone = this.normalizePhone(mobile);

    const sessionResult = await this.pool.query(
      'SELECT session_id FROM otps WHERE phone = $1 ORDER BY created_at DESC LIMIT 1',
      [phone]
    );

    if (sessionResult.rows.length === 0) {
      throw new UnauthorizedException("OTP session not found");
    }

    try {
      const response = await axios.post(
        "https://www.fast2sms.com/dev/otp/verify",
        {
          mobile: phone,
          otp,
          otp_id: process.env.FAST2SMS_OTP_ID,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            "Content-Type": "application/json",
            accept: "application/json",
          },
        },
      );

      console.log("FAST2SMS VERIFY:", response.data);

      if (response.data.return !== true) {
        throw new UnauthorizedException(response.data.message || "Invalid OTP");
      }

      await this.pool.query('DELETE FROM otps WHERE phone = $1', [phone]);

      let userResult = await this.pool.query('SELECT id, name, email, phone, user_type, created_at FROM users WHERE phone = $1', [phone]);
      let user = userResult.rows[0];
      let vendorId = null;

      if (!user) {
        // Create new user
        const newUserResult = await this.pool.query(
          'INSERT INTO users (phone, user_type) VALUES ($1, $2) RETURNING id, name, email, phone, user_type, created_at',
          [phone, user_type]
        );
        user = newUserResult.rows[0];
        
        if (user_type === 'vendor') {
          const vendorResult = await this.pool.query(
            'INSERT INTO vendors (user_id, phone) VALUES ($1, $2) RETURNING id',
            [user.id, phone]
          );
          vendorId = vendorResult.rows[0].id;
        }

        // Send welcome notification
        this.notificationsService.sendNotificationToUser(
          user.id,
          'Welcome to Studio Rental!',
          'Your account has been created successfully. Explore our studios now!'
        );
      } else {
        if (required_role && user.user_type !== required_role) {
          throw new UnauthorizedException('Insufficient permissions');
        }
        if (user.user_type === 'vendor') {
          const vendorResult = await this.pool.query('SELECT id FROM vendors WHERE user_id = $1', [user.id]);
          vendorId = vendorResult.rows[0]?.id;
        }
      }

      return {
        ...user,
        vendorId
      };
    } catch (e: any) {
      if (e instanceof UnauthorizedException) throw e;
      console.log(e.response?.data || e.message);
      throw new InternalServerErrorException("OTP verification failed");
    }
  }

  async googleLogin(body: any) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { email, name, googleId } = body;
      
      let existingUser = await client.query('SELECT id, name, email, user_type, created_at FROM users WHERE email = $1', [email]);
      
      let user;
      if (existingUser.rows.length > 0) {
        user = existingUser.rows[0];
      } else {
        const { rows } = await client.query(
          'INSERT INTO users (name, email, password, user_type) VALUES ($1, $2, $3, $4) RETURNING id, name, email, user_type, created_at',
          [name || email, email, 'google_sso_' + (googleId || Date.now()), 'customer']
        );
        user = rows[0];
      }

      let vendorId = null;
      if (user.user_type === 'vendor') {
        const vendorResult = await client.query('SELECT id FROM vendors WHERE user_id = $1', [user.id]);
        vendorId = vendorResult.rows[0]?.id;
      }

      await client.query('COMMIT');
      return {
        ...user,
        vendorId
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      throw new InternalServerErrorException('Failed to log in with Google');
    } finally {
      client.release();
    }
  }

  async submitKyc(body: any) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS kyc_records (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id),
          full_name VARCHAR(255),
          phone VARCHAR(50),
          email VARCHAR(255),
          dob VARCHAR(50),
          address TEXT,
          status VARCHAR(50) DEFAULT 'completed',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const { user_id, full_name, phone, email, dob, address } = body;

      // Check if user exists
      const existingUser = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (existingUser.rows.length === 0) {
        throw new BadRequestException('User not found');
      }

      // Check if KYC already exists for user
      const existingKyc = await client.query('SELECT id FROM kyc_records WHERE user_id = $1', [user_id]);
      
      let result;
      if (existingKyc.rows.length > 0) {
        // Update
        const { rows } = await client.query(
          'UPDATE kyc_records SET full_name = $1, phone = $2, email = $3, dob = $4, address = $5, status = $6 WHERE user_id = $7 RETURNING *',
          [full_name, phone, email, dob, address, 'completed', user_id]
        );
        result = rows[0];
      } else {
        // Insert
        const { rows } = await client.query(
          'INSERT INTO kyc_records (user_id, full_name, phone, email, dob, address, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [user_id, full_name, phone, email, dob, address, 'completed']
        );
        result = rows[0];
      }

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException('Failed to submit KYC');
    } finally {
      client.release();
    }
  }

  async updateProfile(body: any) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure columns exist
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS address TEXT;
      `);

      const { user_id, name, email, phone, address } = body;

      const { rows } = await client.query(
        'UPDATE users SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5 RETURNING id, name, email, phone, address',
        [name, email, phone, address, user_id]
      );

      if (rows.length === 0) {
        throw new BadRequestException('User not found');
      }

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException('Failed to update profile');
    } finally {
      client.release();
    }
  }

  async updateLocation(body: any) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
      `);

      const { user_id, address, lat, lng } = body;

      const { rows } = await client.query(
        'UPDATE users SET address = $1, latitude = $2, longitude = $3 WHERE id = $4 RETURNING id, address, latitude, longitude',
        [address, lat, lng, user_id]
      );

      if (rows.length === 0) {
        throw new BadRequestException('User not found');
      }

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException('Failed to update location');
    } finally {
      client.release();
    }
  }
}
