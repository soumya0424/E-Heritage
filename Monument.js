const db = require('./database');
const config = require('./config');

class Monument {
    // Get all monuments in Odisha with pagination and filters
    static async getAll(filters = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                type,
                city,
                unesco,
                minRating = 0,
                sortBy = 'rating',
                sortOrder = 'DESC'
            } = filters;

            const offset = (page - 1) * limit;
            let whereConditions = [
                'm.status = "Active"',
                `m.state_id = ${config.state.stateId}` // Only Odisha monuments
            ];
            let params = [];

            // Apply filters
            if (type) {
                whereConditions.push('m.monument_type = ?');
                params.push(type);
            }

            if (city) {
                whereConditions.push('c.name = ?');
                params.push(city);
            }

            if (unesco === 'true') {
                whereConditions.push('m.unesco_site = TRUE');
            }

            if (minRating > 0) {
                whereConditions.push('m.rating >= ?');
                params.push(minRating);
            }

            const whereClause = whereConditions.join(' AND ');

            // Valid sort columns
            const validSortColumns = ['name', 'rating', 'created_at', 'total_reviews', 'entry_fee'];
            const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'rating';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Get monuments
            const query = `
                SELECT 
                    m.*,
                    c.name as city_name,
                    c.latitude as city_latitude,
                    c.longitude as city_longitude,
                    (SELECT image_url FROM monument_images 
                     WHERE monument_id = m.id AND is_primary = TRUE 
                     LIMIT 1) as primary_image
                FROM monuments m
                JOIN cities c ON m.city_id = c.id
                WHERE ${whereClause}
                ORDER BY m.${sortColumn} ${order}
                LIMIT ? OFFSET ?
            `;

            const [monuments] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM monuments m
                JOIN cities c ON m.city_id = c.id
                WHERE ${whereClause}
            `;
            const [countResult] = await db.query(countQuery, params);

            return {
                monuments,
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

    // Get monument by ID with full details
    static async getById(id) {
        try {
            const query = `
                SELECT 
                    m.*,
                    c.name as city_name,
                    c.latitude as city_latitude,
                    c.longitude as city_longitude,
                    c.population as city_population
                FROM monuments m
                JOIN cities c ON m.city_id = c.id
                WHERE m.id = ? AND m.state_id = ?
            `;

            const [monuments] = await db.query(query, [id, config.state.stateId]);

            if (monuments.length === 0) {
                return null;
            }

            // Get all approved images
            const [images] = await db.query(
                `SELECT id, image_url, thumbnail_url, caption, image_type, is_primary, display_order
                 FROM monument_images 
                 WHERE monument_id = ? AND is_approved = TRUE
                 ORDER BY is_primary DESC, display_order ASC`,
                [id]
            );

            // Get recent reviews (top 5)
            const [reviews] = await db.query(
                `SELECT 
                    r.id, r.rating, r.title, r.comment, r.visit_date, r.created_at,
                    u.username, u.profile_image, u.full_name
                 FROM reviews r
                 JOIN users u ON r.user_id = u.id
                 WHERE r.monument_id = ? AND r.status = 'approved'
                 ORDER BY r.created_at DESC
                 LIMIT 5`,
                [id]
            );

            return {
                ...monuments[0],
                images,
                recent_reviews: reviews
            };
        } catch (error) {
            throw error;
        }
    }

    // Get nearby monuments using Haversine formula
    static async getNearby(latitude, longitude, radius = 10, limit = 50) {
        try {
            const query = `
                SELECT 
                    m.*,
                    c.name as city_name,
                    (SELECT image_url FROM monument_images 
                     WHERE monument_id = m.id AND is_primary = TRUE 
                     LIMIT 1) as primary_image,
                    (6371 * acos(
                        cos(radians(?)) * cos(radians(m.latitude)) * 
                        cos(radians(m.longitude) - radians(?)) + 
                        sin(radians(?)) * sin(radians(m.latitude))
                    )) AS distance
                FROM monuments m
                JOIN cities c ON m.city_id = c.id
                WHERE m.status = 'Active' 
                    AND m.state_id = ?
                HAVING distance < ?
                ORDER BY distance ASC
                LIMIT ?
            `;

            const [monuments] = await db.query(
                query,
                [latitude, longitude, latitude, config.state.stateId, radius, parseInt(limit)]
            );

            return monuments;
        } catch (error) {
            throw error;
        }
    }

    // Search monuments in Odisha
    static async search(searchTerm, limit = 50) {
        try {
            const query = `
                SELECT 
                    m.*,
                    c.name as city_name,
                    (SELECT image_url FROM monument_images 
                     WHERE monument_id = m.id AND is_primary = TRUE 
                     LIMIT 1) as primary_image,
                    MATCH(m.name, m.description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
                FROM monuments m
                JOIN cities c ON m.city_id = c.id
                WHERE m.status = 'Active'
                    AND m.state_id = ?
                    AND (
                        MATCH(m.name, m.description) AGAINST(? IN NATURAL LANGUAGE MODE)
                        OR m.name LIKE ?
                        OR m.description LIKE ?
                        OR c.name LIKE ?
                        OR m.monument_type LIKE ?
                    )
                ORDER BY relevance DESC, m.rating DESC
                LIMIT ?
            `;

            const searchPattern = `%${searchTerm}%`;
            const [monuments] = await db.query(
                query,
                [searchTerm, config.state.stateId, searchTerm, searchPattern, searchPattern, searchPattern, searchPattern, parseInt(limit)]
            );

            return monuments;
        } catch (error) {
            throw error;
        }
    }

    // Get monuments by city
    static async getByCity(cityName, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    m.*,
                    c.name as city_name,
                    (SELECT image_url FROM monument_images 
                     WHERE monument_id = m.id AND is_primary = TRUE 
                     LIMIT 1) as primary_image
                FROM monuments m
                JOIN cities c ON m.city_id = c.id
                WHERE m.status = 'Active'
                    AND m.state_id = ?
                    AND c.name = ?
                ORDER BY m.rating DESC
                LIMIT ? OFFSET ?
            `;

            const [monuments] = await db.query(
                query,
                [config.state.stateId, cityName, parseInt(limit), parseInt(offset)]
            );

            const [countResult] = await db.query(
                `SELECT COUNT(*) as total 
                 FROM monuments m 
                 JOIN cities c ON m.city_id = c.id
                 WHERE m.status = 'Active' AND m.state_id = ? AND c.name = ?`,
                [config.state.stateId, cityName]
            );

            return {
                monuments,
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

    // Get monument statistics for Odisha
    static async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_monuments,
                    COUNT(DISTINCT city_id) as total_cities,
                    SUM(CASE WHEN unesco_site = TRUE THEN 1 ELSE 0 END) as unesco_sites,
                    SUM(CASE WHEN asi_protected = TRUE THEN 1 ELSE 0 END) as asi_protected_sites,
                    AVG(rating) as average_rating,
                    SUM(total_reviews) as total_reviews,
                    SUM(total_visitors) as total_visitors,
                    COUNT(CASE WHEN monument_type = 'Temple' THEN 1 END) as temples,
                    COUNT(CASE WHEN monument_type = 'Fort' THEN 1 END) as forts,
                    COUNT(CASE WHEN monument_type = 'Archaeological' THEN 1 END) as archaeological_sites
                FROM monuments
                WHERE status = 'Active' AND state_id = ?
            `;

            const [stats] = await db.query(query, [config.state.stateId]);
            return stats[0];
        } catch (error) {
            throw error;
        }
    }

    // Create new monument (admin only)
    static async create(monumentData) {
        try {
            // Force state_id to Odisha
            monumentData.state_id = config.state.stateId;

            const query = `
                INSERT INTO monuments (
                    name, description, historical_period, built_year, dynasty,
                    architecture_style, latitude, longitude, address, city_id, state_id,
                    monument_type, entry_fee, opening_hours, closing_day, best_time_to_visit,
                    visit_duration, accessibility_features, facilities,
                    ar_available, vr_available, audio_guide_available,
                    unesco_site, asi_protected, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                monumentData.name,
                monumentData.description || null,
                monumentData.historical_period || null,
                monumentData.built_year || null,
                monumentData.dynasty || null,
                monumentData.architecture_style || null,
                monumentData.latitude,
                monumentData.longitude,
                monumentData.address || null,
                monumentData.city_id,
                monumentData.state_id,
                monumentData.monument_type,
                monumentData.entry_fee || 0,
                monumentData.opening_hours || null,
                monumentData.closing_day || null,
                monumentData.best_time_to_visit || null,
                monumentData.visit_duration || null,
                monumentData.accessibility_features || null,
                monumentData.facilities || null,
                monumentData.ar_available || false,
                monumentData.vr_available || false,
                monumentData.audio_guide_available || false,
                monumentData.unesco_site || false,
                monumentData.asi_protected || false,
                monumentData.status || 'Active'
            ];

            const [result] = await db.query(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Update monument (admin only)
    static async update(id, monumentData) {
        try {
            const fields = [];
            const params = [];

            // Allowed fields for update
            const allowedFields = [
                'name', 'description', 'historical_period', 'built_year', 'dynasty',
                'architecture_style', 'latitude', 'longitude', 'address', 'city_id',
                'monument_type', 'entry_fee', 'opening_hours', 'closing_day',
                'best_time_to_visit', 'visit_duration', 'accessibility_features',
                'facilities', 'ar_available', 'vr_available', 'audio_guide_available',
                'unesco_site', 'asi_protected', 'status'
            ];

            Object.keys(monumentData).forEach(key => {
                if (allowedFields.includes(key) && monumentData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    params.push(monumentData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No valid fields to update');
            }

            params.push(id, config.state.stateId);

            const query = `
                UPDATE monuments 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND state_id = ?
            `;

            const [result] = await db.query(query, params);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Delete monument (admin only)
    static async delete(id) {
        try {
            const [result] = await db.query(
                'DELETE FROM monuments WHERE id = ? AND state_id = ?',
                [id, config.state.stateId]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Monument;
