const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const csvPath = path.resolve('./data/vinyls.csv');
const fileContent = fs.readFileSync(csvPath, 'utf-8');

const records = parse(fileContent, {
  columns: true,
  skip_empty_lines: true
});

const seenIds = new Set();
let maxId = 0;
let updated = false;

// First pass: check for duplicates and find the max ID
for (let record of records) {
  if (record.id && record.id.trim() !== '') {
    const currentId = parseInt(record.id.trim(), 10);
    if (seenIds.has(currentId)) {
      console.error(`❌ Build Error: Duplicate ID found -> ${currentId}`);
      process.exit(1);
    }
    seenIds.add(currentId);
    maxId = Math.max(maxId, currentId);
  }
}

// Second pass: assign IDs to any newly added rows left blank
for (let record of records) {
  if (!record.id || record.id.trim() === '') {
    maxId++;
    record.id = maxId.toString();
    updated = true;
    console.log(`✨ Assigned new ID ${maxId} to "${record.album}" by ${record.artist}`);
  }
}

// Rewrite CSV if new IDs were auto-assigned
if (updated) {
  const output = stringify(records, { header: true });
  fs.writeFileSync(csvPath, output);
}