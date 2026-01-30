import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

declare global {
  namespace Express {
    interface Request {
      tenantId?: number;
      tenant?: any;
    }
  }
}

export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const host = req.hostname;
    
    const result = await pool.query(
      'SELECT * FROM tenants WHERE domain = $1 AND is_active = true',
      [host]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    req.tenantId = result.rows[0].id;
    req.tenant = result.rows[0];
    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
