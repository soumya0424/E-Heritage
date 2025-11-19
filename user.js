const db = require('./database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user
    static async create(userData) {
        try {
            const { username, email, password, full_name } = userData;

            // Hash password
            const password_hash = await bcrypt.hash(password, 10);

            const query = `
                INSERT INTO users (username, email, password_hash, full_name)
                VALUES (?, ?, ?, ?)
            `;

            const [result] = await db.query(query, [username, email, password_hash, full_name || null]);
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Username or email already exists');
            }
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            const [users] = await db.query(
                'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
                [email]
            );
            return users[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const [users] = await db.query(
                `SELECT 
                    id, username, email, full_name, profile_image, bio, 
                    phone, city, state, role, email_verified, created_at
                 FROM users 
                 WHERE id = ? AND is_active = TRUE`,
                [id]
            );
            return users[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by username
    static async findByUsername(username) {
        try {
            const [users] = await db.query(
                'SELECT id, username, email, full_name, profile_image FROM users WHERE username = ? AND is_active = TRUE',
                [username]
            );
            return users[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            throw error;
        }
    }

    // Update user profile
    static async update(id, userData) {
        try {
            const fields = [];
            const params = [];

            // Allowed fields for update
            const allowedFields = ['full_name', 'bio', 'phone', 'city', 'state', 'profile_image'];

            Object.keys(userData).forEach(key => {
                if (allowedFields.includes(key) && userData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    params.push(userData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No valid fields to update');
            }

            params.push(id);

            const query = `
                UPDATE users 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const [result] = await db.query(query, params);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Update last login timestamp
    static async updateLastLogin(id) {
        try {
            await db.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
        } catch (error) {
            throw error;
        }
    }

    // Change password
    static async changePassword(id, newPassword) {
        try {
            const password_hash = await bcrypt.hash(newPassword, 10);
            const [result] = await db.query(
                'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [password_hash, id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Get user favorites
    static async getFavorites(userId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    m.*,
                    c.name as city_name,
                    f.created_at as favorited_at,
                    f.notes,
                    (SELECT image_url FROM monument_images 
                     WHERE monument_id = m.id AND is_primary = TRUE 
                     LIMIT 1) as primary_image
                FROM favorites f
                JOIN monuments m ON f.monument_id = m.id
                JOIN cities c ON m.city_id = c.id
                WHERE f.user_id = ?
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [favorites] = await db.query(query, [userId, parseInt(limit), parseInt(offset)]);

            const [countResult] = await db.query(
                'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?',
                [userId]
            );

            return {
                favorites,
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

    // Add to favorites
    static async addFavorite(userId, monumentId, notes = null) {
        try {
            const [result] = await db.query(
                'INSERT INTO favorites (user_id, monument_id, notes) VALUES (?, ?, ?)',
                [userId, monumentId, notes]
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Monument already in favorites');
            }
            throw error;
        }
    }

    // Remove from favorites
    static async removeFavorite(userId, monumentId) {
        try {
            const [result] = await db.query(
                'DELETE FROM favorites WHERE user_id = ? AND monument_id = ?',
                [userId, monumentId]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Check if monument is favorited
    static async isFavorited(userId, monumentId) {
        try {
            const [result] = await db.query(
                'SELECT id FROM favorites WHERE user_id = ? AND monument_id = ?',
                [userId, monumentId]
            );
            return result.length > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get user statistics
    static async getStats(userId) {
        try {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM reviews WHERE user_id = ?) as total_reviews,
                    (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as total_favorites,
                    (SELECT COUNT(*) FROM visit_history WHERE user_id = ?) as total_visits,
                    (SELECT AVG(rating) FROM reviews WHERE user_id = ?) as avg_rating_given
            `;

            const [stats] = await db.query(query, [userId, userId, userId, userId]);
            return stats[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;
