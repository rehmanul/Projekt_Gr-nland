#!/usr/bin/env node

/**
 * Jobiqo Data Export Script
 * Exports data from existing Jobiqo system for migration
 */

const fs = require('fs');
const path = require('path');

async function exportJobiqoData(portalName) {
  console.log(`Exporting data for portal: ${portalName}`);

  // This would connect to Jobiqo API/database
  // For now, create sample export structure

  const exportData = {
    portal: portalName,
    exportedAt: new Date().toISOString(),
    jobs: [],
    employers: [],
    applications: [],
    users: []
  };

  const exportPath = path.join(__dirname, `../../data/exports/${portalName}_export.json`);
  fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

  console.log(`Export completed: ${exportPath}`);
}

const portalName = process.argv[2] || 'badische';
exportJobiqoData(portalName);
