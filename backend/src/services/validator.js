const config = require('../config/config');

/**
 * Post-processes AI output to guarantee the contract the frontend/CRM
 * depends on, regardless of what the model actually returned. This is a
 * deliberate safety net — never trust an LLM's output blindly for
 * constrained fields.
 */
function sanitizeRecord(record) {
  const clean = {};

  for (const field of config.CRM_FIELDS) {
    clean[field] = typeof record[field] === 'string' ? record[field].trim() : '';
  }

  // Enforce allowed enum values; blank out anything that doesn't match.
  if (!config.ALLOWED_CRM_STATUS.includes(clean.crm_status)) {
    clean.crm_status = '';
  }
  if (!config.ALLOWED_DATA_SOURCE.includes(clean.data_source)) {
    clean.data_source = '';
  }

  // Guard against unparseable dates — better blank than a broken CRM import.
  if (clean.created_at && isNaN(new Date(clean.created_at).getTime())) {
    clean.created_at = '';
  }

  // Strip raw newlines that would break CSV row integrity.
  for (const field of config.CRM_FIELDS) {
    if (typeof clean[field] === 'string') {
      clean[field] = clean[field].replace(/\r?\n/g, '\\n');
    }
  }

  return clean;
}

/**
 * A record must have either an email or a mobile number, per spec.
 * This re-checks even after the AI already applied the skip rule, as a
 * second line of defense.
 */
function hasContactInfo(record) {
  return Boolean(record.email || record.mobile_without_country_code);
}

function validateBatchResult(result) {
  const imported = [];
  const skipped = [...(result.skipped || [])];

  for (const rawRecord of result.imported || []) {
    const clean = sanitizeRecord(rawRecord);
    if (!hasContactInfo(clean)) {
      skipped.push({ row: rawRecord, reason: 'No email or mobile number present' });
      continue;
    }
    imported.push(clean);
  }

  return { imported, skipped };
}

module.exports = { validateBatchResult, sanitizeRecord };
