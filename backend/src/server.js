const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const importRoute = require('./routes/import');

const app = express();

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', importRoute);

// Central error handler (catches multer errors like file-too-large, wrong type)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Something went wrong.' });
});

app.listen(config.port, () => {
  console.log(`GrowEasy CSV Importer backend running on port ${config.port}`);
});
