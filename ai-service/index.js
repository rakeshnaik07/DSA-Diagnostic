require('dotenv').config();

const express = require('express');
const cors = require('cors');
const analyzeRouter = require('./src/routes/analyze');

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({ origin: process.env.BACKEND_ORIGIN || 'http://localhost:5000' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/analyze', analyzeRouter);

app.listen(port, () => {
  console.log(`AI service running on port ${port}`);
});
