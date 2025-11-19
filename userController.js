const User = require('./User');
const jwt = require('jsonwebtoken');
const config = require('./config');

// Generate JWT token
const generateToken = (userId, email, role) => {
    return jwt.sign(
        { userId, email, role },
        config.jwt.secret,
        { expiresIn: config.jwt.expire }
    );
};

// Register new user
exports.register = async (req, res, next) => {
    try {
        const { username, email, password, full_name } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create user
        const userId = await User.create({
            username,
            email,
            password,
            full_name
        });

        // Generate token
        const token = generateToken(userId, email, 'user');

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId,
                username,
                email,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// User login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        await User.updateLastLogin(user.id);

        // Generate token
        const token = generateToken(user.id, user.email, user.role);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                userId: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get user profile (authenticated)
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user statistics
        const stats = await User.getStats(userId);

        res.json({
            success: true,
            data: {
                ...user,
                stats
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update user profile (authenticated)
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const allowedUpdates = ['full_name', 'bio', 'phone', 'city', 'state', 'profile_image'];
        
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        await User.update(userId, updates);

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Change password (authenticated)
exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Verify current password
        const user = await User.findByEmail(req.user.email);
        const isValid = await User.verifyPassword(currentPassword, user.password_hash);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        await User.changePassword(userId, newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get user favorites
exports.getFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = req.query.page || 1;
        const limit = req.query.limit || 20;

        const result = await User.getFavorites(userId, page, limit);

        res.json({
            success: true,
            message: 'User favorites retrieved successfully',
            data: result.favorites,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Add to favorites
exports.addFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const monumentId = req.params.monumentId;
        const notes = req.body.notes || null;

        const favoriteId = await User.addFavorite(userId, monumentId, notes);

        res.status(201).json({
            success: true,
            message: 'Monument added to favorites',
            data: { id: favoriteId }
        });
    } catch (error) {
        next(error);
    }
};

// Remove from favorites
exports.removeFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const monumentId = req.params.monumentId;

        const affectedRows = await User.removeFavorite(userId, monumentId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Monument not found in favorites'
            });
        }

        res.json({
            success: true,
            message: 'Monument removed from favorites'
        });
    } catch (error) {
        next(error);
    }
};

// Check if monument is favorited
exports.checkFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const monumentId = req.params.monumentId;

        const isFavorited = await User.isFavorited(userId, monumentId);

        res.json({
            success: true,
            data: { isFavorited }
        });
    } catch (error) {
        next(error);
    }
};
