const express = require('express');
const app = express();

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('Bot is alive!');
});

// Simple status endpoint
app.get('/ping', (req, res) => {
    res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Keep-alive server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/`);
});

module.exports = app;