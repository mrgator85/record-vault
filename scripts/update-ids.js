import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const csvPath = path.resolve('./src/data/vinyls.csv');
const jsonOutputDir = path.resolve('./public/api');
const jsonOutputPath = path.join(jsonOutputDir, 'collection.json');

if (!fs.existsSync(csvPath)) {
  console.error('❌ Error: collection.csv not found at src/data/collection.csv');
  process.exit(1);
}

const fileContent = fs.readFileSync(csvPath, 'utf-8');

const rawRecords = parse(fileContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

// Normalize all header keys to lowercase (turns 'ID', 'Id', etc. into 'id')
const records = rawRecords.map(record => {
  const normalized = {};
  for (const key of Object.keys(record)) {
    normalized[key.toLowerCase()] = record[key];
  }
  return normalized;
});

const seenIds = new Set();
let maxId = 0;
let updated = false;

// First pass: Validate existing IDs
for (let record of records) {
  if (record.id !== undefined && record.id !== null && record.id.toString().trim() !== '') {
    const currentId = parseInt(record.id.toString().trim(), 10);
    
    if (isNaN(currentId)) {
      console.error(`❌ Build Error: Non-numeric ID found -> "${record.id}" for album "${record.album}"`);
      process.exit(1);
    }
    
    if (seenIds.has(currentId)) {
      console.error(`❌ Build Error: Duplicate ID found -> ${currentId}`);
      process.exit(1);
    }
    
    seenIds.add(currentId);
    maxId = Math.max(maxId, currentId);
  }
}

// Second pass: Assign IDs only to rows where id is genuinely missing/blank
for (let record of records) {
  const hasId = record.id !== undefined && record.id !== null && record.id.toString().trim() !== '';
  
  if (!hasId) {
    maxId++;
    record.id = maxId.toString();
    updated = true;
    console.log(`✨ Assigned new sequential ID ${maxId} to "${record.album}" by ${record.artist}`);
  }
}

// Rewrite CSV if new IDs were added
if (updated) {
  const output = stringify(records, { header: true });
  fs.writeFileSync(csvPath, output);
  console.log("✅ CSV updated with clean lowercase 'id' header.");
} else {
  console.log('ℹ️ All records already had valid, unique IDs.');
}

// Ensure public/api directory exists and write the clean JSON payload
if (!fs.existsSync(jsonOutputDir)) {
  fs.mkdirSync(jsonOutputDir, { recursive: true });
}

fs.writeFileSync(jsonOutputPath, JSON.stringify(records, null, 2));
console.log('✅ Successfully generated public/api/collection.json with a single, clean ID field.');