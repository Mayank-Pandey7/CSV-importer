const { parse } = require('csv-parse/sync');

/**
 * Parses a raw CSV buffer/string into an array of row objects.
 * Does NOT assume fixed column names — whatever headers exist in the
 * uploaded file become the object keys. This is intentional: the AI
 * extraction step is responsible for mapping arbitrary headers to the
 * fixed GrowEasy CRM schema.
 */
function parseCSV(csvBuffer) {
  const csvString = Buffer.isBuffer(csvBuffer)
    ? csvBuffer.toString('utf-8')
    : csvBuffer;

  if (!csvString || !csvString.trim()) {
    throw new Error('CSV file is empty.');
  }

  let records;
  try {
    records = parse(csvString, {
      columns: true, // use first row as headers
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // tolerate ragged rows from messy exports
      bom: true,
    });
  } catch (err) {
    throw new Error(`Failed to parse CSV: ${err.message}`);
  }

  if (!records.length) {
    throw new Error('CSV file has no data rows.');
  }

  return records;
}

module.exports = { parseCSV };
