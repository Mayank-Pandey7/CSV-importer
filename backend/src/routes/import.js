const express = require('express');
const multer = require('multer');
const { parseCSV } = require('../services/csvParser');
const { extractBatch } = require('../services/aiExtractor');
const { validateBatchResult } = require('../services/validator');
const { chunkArray } = require('../utils/batchHelper');
const config = require('../config/config');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches spec's sample UI
  fileFilter: (req, file, cb) => {
    const isCSV =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv');
    if (!isCSV) {
      return cb(new Error('Only .csv files are supported.'));
    }
    cb(null, true);
  },
});

/**
 * Runs extractBatch with retries + exponential backoff. If every attempt
 * fails, the whole batch is marked skipped rather than failing the entire
 * request — one bad batch should never take down the full import.
 */
async function extractBatchWithRetry(rows, batchIndex) {
  let lastError;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await extractBatch(rows);
      return validateBatchResult(result);
    } catch (err) {
      lastError = err;
      if (attempt < config.maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }
  console.error(`Batch ${batchIndex} failed after retries:`, lastError.message);
  return {
    imported: [],
    skipped: rows.map((row) => ({
      row,
      reason: `AI extraction failed for this batch: ${lastError.message}`,
    })),
  };
}

// POST /api/import — full pipeline: CSV -> batches -> AI -> validated JSON
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded (field name must be "file").' });
  }

  let rows;
  try {
    rows = parseCSV(req.file.buffer);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const batches = chunkArray(rows, config.batchSize);

  const imported = [];
  const skipped = [];

  // Batches run sequentially to stay well within rate limits; can be
  // parallelized with Promise.all + a concurrency limiter if needed later.
  for (let i = 0; i < batches.length; i++) {
    const result = await extractBatchWithRetry(batches[i], i);
    imported.push(...result.imported);
    skipped.push(...result.skipped);
  }

  return res.json({
    imported,
    skipped,
    totalImported: imported.length,
    totalSkipped: skipped.length,
    totalRows: rows.length,
  });
});

module.exports = router;
