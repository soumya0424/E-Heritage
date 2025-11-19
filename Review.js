const db = require('./database');
const config = require('./config');

class Review {
    // Create new review
    static async create(reviewData) {
        try {
            const { monument_id, user_id, rating, title, comment, visit_date } = reviewData;

            const query = `
                INSERT INTO reviews (monument_id, user_id, rating, title, comment, visit_date)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.query(query, [
                monument_id,
                user_id,
                rating,
                title || null,
                comment || null,
                visit_date || null
            ]);

            // Update monument rating after new review
            await this.updateMonumentRating(monument_id);

            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('You have already reviewed this monument');
            }
            throw error;
        }
    }

    // Get reviews for a monument
    static async getByMonument(monumentId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    r.*,
                    u.username,
                    u.profile_image,
                    u.full_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.monument_id = ? AND r.status = 'approved'
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [reviews] = await db.query(query, [monumentId, parseInt(limit), parseInt(offset)]);

            const [countResult] = await db.query(
                'SELECT COUNT(*) as total FROM reviews WHERE monument_id = ? AND status = "approved"',
                [monumentId]
            );

            // Get rating distribution
            const [ratingDist] = await db.query(
                `SELECT 
                    rating,
                    COUNT(*) as count
                FROM reviews
                WHERE monument_id = ? AND status = 'approved'
                GROUP BY rating
                ORDER BY rating DESC`,
                [monumentId]
            );

            return {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                },
                ratingDistribution: ratingDist
            };
        } catch (error) {
            throw error;
        }
    }

    // Get review by ID
    static async getById(reviewId) {
        try {
            const query = `
                SELECT 
                    r.*,
                    u.username,
                    u.profile_image,
                    u.full_name,
                    m.name as monument_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN monuments m ON r.monument_id = m.id
                WHERE r.id = ?
            `;

            const [reviews] = await db.query(query, [reviewId]);
            return reviews[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Get user's reviews
    static async getUserReviews(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    r.*,
                    m.name as monument_name,
                    m.monument_type,
                    c.name as city_name
                FROM reviews r
                JOIN monuments m ON r.monument_id = m.id
                JOIN cities c ON m.city_id = c.id
                WHERE r.user_id = ?
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [reviews] = await db.query(query, [userId, parseInt(limit), parseInt(offset)]);

            const [countResult] = await db.query(
                'SELECT COUNT(*) as total FROM reviews WHERE user_id = ?',
                [userId]
            );

            return {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Update review
    static async update(reviewId, userId, updateData) {
        try {
            const fields = [];
            const params = [];

            const allowedFields = ['rating', 'title', 'comment', 'visit_date'];

            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    params.push(updateData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No valid fields to update');
            }

            params.push(reviewId, userId);

            const query = `
                UPDATE reviews 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            `;

            const [result] = await db.query(query, params);

            // Update monument rating if review was updated
            if (result.affectedRows > 0 && updateData.rating !== undefined) {
                const [review] = await db.query('SELECT monument_id FROM reviews WHERE id = ?', [reviewId]);
                if (review.length > 0) {
                    await this.updateMonumentRating(review[0].monument_id);
                }
            }

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Delete review
    static async delete(reviewId, userId) {
        try {
            // Get monument_id before deletion
            const [review] = await db.query(
                'SELECT monument_id FROM reviews WHERE id = ? AND user_id = ?',
                [reviewId, userId]
            );

            if (review.length === 0) {
                return 0;
            }

            const [result] = await db.query(
                'DELETE FROM reviews WHERE id = ? AND user_id = ?',
                [reviewId, userId]
            );

            // Update monument rating after deletion
            if (result.affectedRows > 0) {
                await this.updateMonumentRating(review[0].monument_id);
            }

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Update monument rating (helper function)
    static async updateMonumentRating(monumentId) {
        try {
            const [stats] = await db.query(
                `SELECT 
                    COALESCE(AVG(rating), 0) as avg_rating,
                    COUNT(*) as total_reviews
                FROM reviews
                WHERE monument_id = ? AND status = 'approved'`,
                [monumentId]
            );

            await db.query(
                'UPDATE monuments SET rating = ?, total_reviews = ? WHERE id = ?',
                [stats[0].avg_rating || 0, stats[0].total_reviews, monumentId]
            );
        } catch (error) {
            throw error;
        }
    }

    // Mark review as helpful
    static async markHelpful(reviewId) {
        try {
            const [result] = await db.query(
                'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
                [reviewId]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Check if user has reviewed a monument
    static async hasUserReviewed(userId, monumentId) {
        try {
            const [result] = await db.query(
                'SELECT id FROM reviews WHERE user_id = ? AND monument_id = ?',
                [userId, monumentId]
            );
            return result.length > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Review;
