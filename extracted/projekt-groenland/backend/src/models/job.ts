import pool from '../config/database';

export interface Job {
  id: number;
  tenant_id: number;
  employer_id: number;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  salary_min?: number;
  salary_max?: number;
  published_at?: Date;
  expires_at?: Date;
  is_active: boolean;
  visibility: string[];
  created_at: Date;
  updated_at: Date;
}

export class JobModel {
  static async findAll(tenantId: number, filters: any = {}) {
    let query = `
      SELECT j.*, e.name as employer_name
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.tenant_id = $1 AND j.is_active = true
    `;
    
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.location) {
      query += ` AND j.location ILIKE $${paramIndex}`;
      params.push(`%${filters.location}%`);
      paramIndex++;
    }

    if (filters.employment_type) {
      query += ` AND j.employment_type = $${paramIndex}`;
      params.push(filters.employment_type);
      paramIndex++;
    }

    query += ' ORDER BY j.published_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id: number, tenantId: number) {
    const result = await pool.query(
      `SELECT j.*, e.* as employer
       FROM jobs j
       LEFT JOIN employers e ON j.employer_id = e.id
       WHERE j.id = $1 AND j.tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  static async create(data: Partial<Job>) {
    const result = await pool.query(
      `INSERT INTO jobs (
        tenant_id, employer_id, title, description, location,
        employment_type, salary_min, salary_max, visibility
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.tenant_id,
        data.employer_id,
        data.title,
        data.description,
        data.location,
        data.employment_type,
        data.salary_min,
        data.salary_max,
        data.visibility || ['primary']
      ]
    );
    return result.rows[0];
  }

  static async update(id: number, tenantId: number, data: Partial<Job>) {
    const fields = [];
    const values = [];
    let index = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id, tenantId);
    
    const result = await pool.query(
      `UPDATE jobs SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${index} AND tenant_id = $${index + 1}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id: number, tenantId: number) {
    await pool.query(
      'UPDATE jobs SET is_active = false WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }
}
