const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

const path = require('path');

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Set security HTTP headers allowing QA dashboard fonts/scripts
app.use(cors()); // Enable CORS

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public
app.use(express.static(path.join(__dirname, 'public')));

const chatRoutes = require('./routes/chatRoutes');
const qaRoutes = require('./routes/qaRoutes');

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Smart Clinic AI API' });
});

// QA Dashboard Route
app.get('/qa', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qa-dashboard.html'));
});
app.get('/qa-playground', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qa-dashboard.html'));
});

// Mount Chat & Clinic API Routes
app.use('/api', chatRoutes);
app.use('/api/qa', qaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
