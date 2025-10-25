const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./src/config/config');

// Import routes
const monumentRoutes = require('./src/routes/monumentRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const travelRoutes = require('./src/routes/travelRoutes');

// Error handler middleware
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/monuments', monumentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/travel', travelRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'E-Heritage Vault Backend is running' });
});

// Error handler (must be last middleware)
app.use(errorHandler);

app.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT}`);
});
