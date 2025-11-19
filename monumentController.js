const Monument = require('./Monument');
const config = require('./config');

// Get all monuments in Odisha
exports.getAllMonuments = async (req, res, next) => {
    try {
        const filters = {
            page: req.query.page || 1,
            limit: req.query.limit || 20,
            type: req.query.type,
            city: req.query.city,
            unesco: req.query.unesco,
            minRating: req.query.minRating || 0,
            sortBy: req.query.sortBy || 'rating',
            sortOrder: req.query.sortOrder || 'DESC'
        };

        const result = await Monument.getAll(filters);

        res.json({
            success: true,
            message: `Monuments in ${config.state.name}`,
            data: result.monuments,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Get monument by ID
exports.getMonumentById = async (req, res, next) => {
    try {
        const monumentId = req.params.id;
        const monument = await Monument.getById(monumentId);

        if (!monument) {
            return res.status(404).json({
                success: false,
                message: 'Monument not found in Odisha'
            });
        }

        res.json({
            success: true,
            data: monument
        });
    } catch (error) {
        next(error);
    }
};

// Get nearby monuments (geolocation-based)
exports.getNearbyMonuments = async (req, res, next) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query;

        const monuments = await Monument.getNearby(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(radius)
        );

        res.json({
            success: true,
            message: `Found ${monuments.length} monuments within ${radius}km`,
            data: monuments,
            count: monuments.length
        });
    } catch (error) {
        next(error);
    }
};

// Search monuments
exports.searchMonuments = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const monuments = await Monument.search(q.trim());

        res.json({
            success: true,
            message: `Found ${monuments.length} monuments matching "${q}"`,
            data: monuments,
            count: monuments.length
        });
    } catch (error) {
        next(error);
    }
};

// Get monuments by city
exports.getMonumentsByCity = async (req, res, next) => {
    try {
        const cityName = req.params.city;
        const page = req.query.page || 1;
        const limit = req.query.limit || 20;

        const result = await Monument.getByCity(cityName, page, limit);

        res.json({
            success: true,
            message: `Monuments in ${cityName}, Odisha`,
            data: result.monuments,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Get Odisha monument statistics
exports.getStats = async (req, res, next) => {
    try {
        const stats = await Monument.getStats();

        res.json({
            success: true,
            message: `Statistics for ${config.state.name} monuments`,
            data: {
                state: config.state.name,
                state_code: config.state.code,
                ...stats
            }
        });
    } catch (error) {
        next(error);
    }
};

// Create monument (admin only)
exports.createMonument = async (req, res, next) => {
    try {
        const monumentId = await Monument.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Monument created successfully',
            data: { id: monumentId }
        });
    } catch (error) {
        next(error);
    }
};

// Update monument (admin only)
exports.updateMonument = async (req, res, next) => {
    try {
        const monumentId = req.params.id;
        const affectedRows = await Monument.update(monumentId, req.body);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Monument not found in Odisha'
            });
        }

        res.json({
            success: true,
            message: 'Monument updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Delete monument (admin only)
exports.deleteMonument = async (req, res, next) => {
    try {
        const monumentId = req.params.id;
        const affectedRows = await Monument.delete(monumentId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Monument not found in Odisha'
            });
        }

        res.json({
            success: true,
            message: 'Monument deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
