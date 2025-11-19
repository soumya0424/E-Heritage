const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    
    next();
};

// Monument validation rules
exports.validateMonument = [
    body('name')
        .trim()
        .notEmpty().withMessage('Monument name is required')
        .isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 }).withMessage('Description too long (max 5000 chars)'),
    
    body('latitude')
        .notEmpty().withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude (-90 to 90)'),
    
    body('longitude')
        .notEmpty().withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude (-180 to 180)'),
    
    body('city_id')
        .notEmpty().withMessage('City ID is required')
        .isInt().withMessage('City ID must be an integer'),
    
    body('monument_type')
        .notEmpty().withMessage('Monument type is required')
        .isIn(['Temple', 'Fort', 'Palace', 'Archaeological', 'Museum', 'Heritage Village', 'Sacred Grove', 'Cave', 'Stepwell', 'Other'])
        .withMessage('Invalid monument type'),
    
    body('entry_fee')
        .optional()
        .isFloat({ min: 0 }).withMessage('Entry fee must be positive'),
    
    this.validate
];

// User registration validation
exports.validateUserRegistration = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
    
    body('full_name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Name too long (max 100 chars)'),
    
    this.validate
];

// User login validation
exports.validateUserLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address'),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    this.validate
];

// Review validation
exports.validateReview = [
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Comment too long (max 1000 chars)'),
    
    body('visit_date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    
    this.validate
];

// ID parameter validation
exports.validateId = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID'),
    
    this.validate
];

// Geolocation query validation
exports.validateGeolocation = [
    query('latitude')
        .notEmpty().withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    
    query('longitude')
        .notEmpty().withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    
    query('radius')
        .optional()
        .isFloat({ min: 0.1, max: 100 }).withMessage('Radius must be between 0.1 and 100 km'),
    
    this.validate
];
