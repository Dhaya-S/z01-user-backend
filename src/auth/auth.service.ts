import { Injectable, Inject, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AuthService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async register(body: any) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { name, email, password, user_type = 'customer', metadata } = body;
      
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        throw new BadRequestException('User already exists');
      }
      
      const { rows: userRows } = await client.query(
        'INSERT INTO users (name, email, password, user_type) VALUES ($1, $2, $3, $4) RETURNING id, name, email, user_type, created_at',
        [name || email, email, password, user_type]
      );
      
      const userId = userRows[0].id;
      let vendorId = null;
      
      // Create Vendor record only if user_type is 'vendor'
      if (user_type === 'vendor') {
        const { rows: vendorRows } = await client.query(
          'INSERT INTO vendors (user_id, company_name, contact_person, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [
            userId,
            metadata?.companyName || name,
            metadata?.contactPerson || name,
            metadata?.phone,
            email
          ]
        );
        vendorId = vendorRows[0].id;
      }

      await client.query('COMMIT');
      return {
        ...userRows[0],
        vendorId
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to register user');
    } finally {
      client.release();
    }
  }

  async login(body: any) {
    try {
      const { email, password, required_role } = body;
      
      let query = 'SELECT id, name, email, user_type, created_at FROM users WHERE email = $1 AND password = $2';
      const params = [email, password];

      if (required_role) {
        query += ' AND user_type = $3';
        params.push(required_role);
      }

      const { rows } = await this.pool.query(query, params);
      
      if (rows.length === 0) {
        throw new UnauthorizedException('Invalid credentials or insufficient permissions');
      }

      // If it's a vendor, fetch the vendorId
      let vendorId = null;
      if (rows[0].user_type === 'vendor') {
        const vendorResult = await this.pool.query('SELECT id FROM vendors WHERE user_id = $1', [rows[0].id]);
        vendorId = vendorResult.rows[0]?.id;
      }

      return {
        ...rows[0],
        vendorId
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Failed to log in');
    }
  }
}
