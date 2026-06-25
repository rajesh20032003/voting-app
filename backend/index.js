const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// in-memory vote store
const votes = {
  option_a: { label: process.env.OPTION_A || 'Cats', count: 0 },
  option_b: { label: process.env.OPTION_B || 'Dogs', count: 0 }
};

const voters = new Set(); // track unique voters by IP

// health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// get current results
app.get('/results', (req, res) => {
  const total = votes.option_a.count + votes.option_b.count;
  res.json({
    total,
    option_a: {
      label: votes.option_a.label,
      count: votes.option_a.count,
      percentage: total > 0 ? ((votes.option_a.count / total) * 100).toFixed(1) : 0
    },
    option_b: {
      label: votes.option_b.label,
      count: votes.option_b.count,
      percentage: total > 0 ? ((votes.option_b.count / total) * 100).toFixed(1) : 0
    }
  });
});

// submit a vote
app.post('/vote', (req, res) => {
  const { option } = req.body;
  const voterIp = req.ip || req.connection.remoteAddress;

  if (!option || !['option_a', 'option_b'].includes(option)) {
    return res.status(400).json({ error: 'Invalid option. Use option_a or option_b' });
  }

  if (voters.has(voterIp)) {
    return res.status(429).json({ error: 'You have already voted!' });
  }

  voters.add(voterIp);
  votes[option].count++;

  res.json({
    message: `Vote cast for ${votes[option].label}!`,
    option,
    label: votes[option].label
  });
});

// reset votes (admin)
app.delete('/votes', (req, res) => {
  votes.option_a.count = 0;
  votes.option_b.count = 0;
  voters.clear();
  res.json({ message: 'Votes reset successfully' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Voting API running on port ${PORT}`);
    console.log(`Options: ${votes.option_a.label} vs ${votes.option_b.label}`);
  });
}

module.exports = app;