const jwt = require('jsonwebtoken');
const config = require('./config');

// Verify JWT token
exports.verifyToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization header provided'
            });
        }

        const token = authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Attach user info to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Token verification failed'
        });
    }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required. You do not have permission.'
        });
    }
    
    next();
};

// Check if user is moderator or admin
exports.isModerator = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({
            success: false,
            message: 'Moderator or Admin access required'
        });
    }
    
    next();
};

// Optional authentication (doesn't fail if no token)
exports.optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};
