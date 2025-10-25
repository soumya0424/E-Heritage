const jwt = require('jsonwebtoken');
const config = require('../config/config');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token missing' });

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.user = decoded; // Attach user info from token
        next();
    });
};

exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin')
        return res.status(403).json({ message: 'Admin access required' });
    next();
};
