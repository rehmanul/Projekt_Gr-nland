import pool from '../config/database';

export interface Employer {
  id: number;
  tenant_id: number;
  owner_id: number;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  location: string;
}

export class EmployerModel {
  static async findAll(tenantId: number) {
    const result = await pool.query(
      'SELECT * FROM employers WHERE tenant_id = $1 AND is_active = true',
      [tenantId]
    );
    return result.rows;
  }

  static async findById(id: number, tenantId: number) {
    const result = await pool.query(
      'SELECT * FROM employers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }

  static async create(data: Partial<Employer>) {
    const result = await pool.query(
      `INSERT INTO employers (tenant_id, owner_id, name, description, website, industry, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.tenant_id, data.owner_id, data.name, data.description, 
       data.website, data.industry, data.location]
    );
    return result.rows[0];
  }
}
