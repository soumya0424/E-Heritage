 const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    port: config.database.port,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0
});

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        console.log(`📊 Database: ${config.database.name}`);
        console.log(`🏛️  State: ${config.state.name}`);
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('💡 Make sure MySQL is running and credentials are correct in .env');
    }
};

testConnection();

module.exports = pool;

