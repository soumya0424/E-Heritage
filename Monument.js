const db = require('../config/database');

class Monument {
    static async getAll(limit = 20, offset = 0) {
        const [rows] = await db.query(
            `SELECT * FROM monuments WHERE status = 'Active' LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query(
            `SELECT * FROM monuments WHERE id = ? AND status = 'Active'`,
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    // Add more DB methods as needed
}

module.exports = Monument;
