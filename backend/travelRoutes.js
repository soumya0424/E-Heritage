const express = require('express');
const router = express.Router();
const { generateAllBookingLinks } = require('./travelService');
const { findNearbyHotels, findNearbyRestaurants } = require('./googlePlacesService');

// Monument coordinates (for reference)
const monuments = {
    1: { name: "Konark Sun Temple", lat: 19.8876, lon: 86.0944 },
    2: { name: "Lingaraj Temple", lat: 20.2380, lon: 85.8360 },
    3: { name: "Jagannath Temple Puri", lat: 19.8048, lon: 85.8182 },
    4: { name: "Udayagiri Caves", lat: 20.2623, lon: 85.7792 },
    5: { name: "Rajarani Temple", lat: 20.2500, lon: 85.8320 }
};

/**
 * GET /api/travel/hotels/:monumentId
 * Get real hotels near a specific monument using Google Places API
 */
router.get('/hotels/:monumentId', async (req, res) => {
    try {
        const monumentId = parseInt(req.params.monumentId);
        const monument = monuments[monumentId];
        
        if (!monument) {
            return res.status(404).json({
                success: false,
                message: 'Monument not found'
            });
        }

        // Get hotels from Google Places API
        const hotels = await findNearbyHotels(monument.lat, monument.lon, 5000);
        
        // Add booking links to each hotel
        const hotelsWithBooking = hotels.map(hotel => ({
            ...hotel,
            bookingLinks: generateAllBookingLinks(hotel)
        }));

        res.json({
            success: true,
            monument: monument.name,
            count: hotelsWithBooking.length,
            data: hotelsWithBooking
        });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hotels',
            error: error.message
        });
    }
});

/**
 * GET /api/travel/restaurants/:monumentId
 * Get real restaurants near a specific monument using Google Places API
 */
router.get('/restaurants/:monumentId', async (req, res) => {
    try {
        const monumentId = parseInt(req.params.monumentId);
        const monument = monuments[monumentId];
        
        if (!monument) {
            return res.status(404).json({
                success: false,
                message: 'Monument not found'
            });
        }

        // Get restaurants from Google Places API
        const restaurants = await findNearbyRestaurants(monument.lat, monument.lon, 5000);
        
        // Add booking links to each restaurant
        const restaurantsWithBooking = restaurants.map(restaurant => ({
            ...restaurant,
            bookingLinks: generateAllBookingLinks(restaurant)
        }));

        res.json({
            success: true,
            monument: monument.name,
            count: restaurantsWithBooking.length,
            data: restaurantsWithBooking
        });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching restaurants',
            error: error.message
        });
    }
});

/**
 * GET /api/travel/nearby/:monumentId
 * Get both hotels and restaurants for a monument
 */
router.get('/nearby/:monumentId', async (req, res) => {
    try {
        const monumentId = parseInt(req.params.monumentId);
        const monument = monuments[monumentId];
        
        if (!monument) {
            return res.status(404).json({
                success: false,
                message: 'Monument not found'
            });
        }

        // Fetch both in parallel
        const [hotels, restaurants] = await Promise.all([
            findNearbyHotels(monument.lat, monument.lon, 5000),
            findNearbyRestaurants(monument.lat, monument.lon, 5000)
        ]);
        
        // Add booking links
        const hotelsWithBooking = hotels.slice(0, 5).map(hotel => ({
            ...hotel,
            bookingLinks: generateAllBookingLinks(hotel)
        }));
        
        const restaurantsWithBooking = restaurants.slice(0, 5).map(restaurant => ({
            ...restaurant,
            bookingLinks: generateAllBookingLinks(restaurant)
        }));

        res.json({
            success: true,
            monument: monument.name,
            data: {
                hotels: hotelsWithBooking,
                restaurants: restaurantsWithBooking
            }
        });
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching nearby places',
            error: error.message
        });
    }
});

/**
 * GET /api/travel/hotels
 * Get hotels for all monuments (general endpoint)
 */
router.get('/hotels', async (req, res) => {
    try {
        // Default to Lingaraj Temple (Bhubaneswar)
        const hotels = await findNearbyHotels(20.2380, 85.8360, 10000);
        
        const hotelsWithBooking = hotels.map(hotel => ({
            ...hotel,
            bookingLinks: generateAllBookingLinks(hotel)
        }));

        res.json({
            success: true,
            location: 'Bhubaneswar',
            count: hotelsWithBooking.length,
            data: hotelsWithBooking
        });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hotels',
            error: error.message
        });
    }
});

/**
 * GET /api/travel/restaurants
 * Get restaurants for all monuments (general endpoint)
 */
router.get('/restaurants', async (req, res) => {
    try {
        // Default to Lingaraj Temple (Bhubaneswar)
        const restaurants = await findNearbyRestaurants(20.2380, 85.8360, 10000);
        
        const restaurantsWithBooking = restaurants.map(restaurant => ({
            ...restaurant,
            bookingLinks: generateAllBookingLinks(restaurant)
        }));

        res.json({
            success: true,
            location: 'Bhubaneswar',
            count: restaurantsWithBooking.length,
            data: restaurantsWithBooking
        });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching restaurants',
            error: error.message
        });
    }
});

module.exports = router;
