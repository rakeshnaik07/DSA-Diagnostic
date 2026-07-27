require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const problemsRouter = require('./routes/problems');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/problems', problemsRouter);

const executeRouter = require('./routes/execute');
app.use('/api/execute', executeRouter);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const sessionsRouter = require('./routes/sessions');
app.use('/api/sessions', sessionsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
