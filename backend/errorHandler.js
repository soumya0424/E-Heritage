 
const config = require('./config');

module.exports = (err, req, res, next) => {
    console.error('❌ Error occurred:');
    console.error(err.stack);
    
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
