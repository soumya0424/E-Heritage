const config = require('./config');

// Central error handling middleware
module.exports = (err, req, res, next) => {
    console.error('❌ Error occurred:');
    console.error(err.stack);
    
    // Database errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry. Record already exists.',
            ...(config.server.env === 'development' && { error: err.message })
        });
    }
    
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Invalid reference. Related record not found.',
            ...(config.server.env === 'development' && { error: err.message })
        });
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors
        });
    }
    
    // JWT errors (should be caught by auth middleware, but just in case)
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }
    
    // Default error response
    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(config.server.env === 'development' && { 
            stack: err.stack,
            error: err 
        })
    });
};
