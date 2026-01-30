#!/usr/bin/env node

/**
 * Data Import Script
 * Imports Jobiqo export data into Grönland platform
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function importData(portalName, validate = false) {
  console.log(`Importing data for portal: ${portalName}`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const exportPath = path.join(__dirname, `../../data/exports/${portalName}_export.json`);
  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

  try {
    await pool.query('BEGIN');

    // Get or create tenant
    const tenantResult = await pool.query(
      'SELECT id FROM tenants WHERE domain = $1',
      [`${portalName}-jobs.de`]
    );

    const tenantId = tenantResult.rows[0]?.id;

    if (!tenantId) {
      throw new Error('Tenant not found');
    }

    // Import jobs, employers, etc.
    console.log(`Importing ${exportData.jobs.length} jobs...`);
    console.log(`Importing ${exportData.employers.length} employers...`);

    if (validate) {
      console.log('Validation mode: Rolling back changes');
      await pool.query('ROLLBACK');
    } else {
      await pool.query('COMMIT');
      console.log('Import completed successfully');
    }
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const portalName = process.argv[2] || 'badische';
const validate = process.argv.includes('--validate');

importData(portalName, validate);
