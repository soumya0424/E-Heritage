require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    MAKEMYTRIP_API_KEY: process.env.MAKEMYTRIP_API_KEY,
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
};
