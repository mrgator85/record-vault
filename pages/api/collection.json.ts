import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const csvPath = path.resolve('./src/data/collection.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  return new Response(JSON.stringify(records, null, 2), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};