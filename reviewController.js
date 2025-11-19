const Review = require('./Review');

// Get reviews for a monument
exports.getMonumentReviews = async (req, res, next) => {
    try {
        const monumentId = req.params.monumentId;
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;

        const result = await Review.getByMonument(monumentId, page, limit);

        res.json({
            success: true,
            data: result.reviews,
            pagination: result.pagination,
            ratingDistribution: result.ratingDistribution
        });
    } catch (error) {
        next(error);
    }
};

// Get user's own reviews
exports.getUserReviews = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;

        const result = await Review.getUserReviews(userId, page, limit);

        res.json({
            success: true,
            data: result.reviews,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Create a review (authenticated)
exports.createReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const monumentId = req.params.monumentId;
        const { rating, title, comment, visit_date } = req.body;

        // Check if user has already reviewed this monument
        const hasReviewed = await Review.hasUserReviewed(userId, monumentId);
        if (hasReviewed) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this monument. You can update your existing review.'
            });
        }

        const reviewId = await Review.create({
            monument_id: monumentId,
            user_id: userId,
            rating,
            title,
            comment,
            visit_date
        });

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: { id: reviewId }
        });
    } catch (error) {
        next(error);
    }
};

// Update review (authenticated, own review only)
exports.updateReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const reviewId = req.params.id;
        const { rating, title, comment, visit_date } = req.body;

        const updates = {};
        if (rating !== undefined) updates.rating = rating;
        if (title !== undefined) updates.title = title;
        if (comment !== undefined) updates.comment = comment;
        if (visit_date !== undefined) updates.visit_date = visit_date;

        const affectedRows = await Review.update(reviewId, userId, updates);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or you do not have permission to update it'
            });
        }

        res.json({
            success: true,
            message: 'Review updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Delete review (authenticated, own review only)
exports.deleteReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const reviewId = req.params.id;

        const affectedRows = await Review.delete(reviewId, userId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or you do not have permission to delete it'
            });
        }

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Mark review as helpful
exports.markHelpful = async (req, res, next) => {
    try {
        const reviewId = req.params.id;

        await Review.markHelpful(reviewId);

        res.json({
            success: true,
            message: 'Review marked as helpful'
        });
    } catch (error) {
        next(error);
    }
};
