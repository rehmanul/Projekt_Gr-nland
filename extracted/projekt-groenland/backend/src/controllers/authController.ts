import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { generateToken, generateRefreshToken } from '../config/jwt';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenant_id 
      });

      const refreshToken = generateRefreshToken({ id: user.id });

      res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { email, password, role, tenantId } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (tenant_id, email, password_hash, role)
         VALUES ($1, $2, $3, $4) RETURNING id, email, role`,
        [tenantId, email, hashedPassword, role]
      );

      res.status(201).json({ data: result.rows[0] });
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
}
