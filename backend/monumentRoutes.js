const express = require('express');
const router = express.Router();

// Monuments data with coordinates
const monuments = [
    {
        id: 1,
        name: "Konark Sun Temple",
        description: "13th-century UNESCO World Heritage Site designed as a colossal chariot",
        city: "Konark",
        state: "Odisha",
        latitude: 19.8876,
        longitude: 86.0944,
        image: "Konark-Sun-Temple.jpg",
        type: "Temple",
        unesco: true,
        rating: 4.8
    },
    {
        id: 2,
        name: "Lingaraj Temple",
        description: "Ancient Hindu temple dedicated to Lord Shiva",
        city: "Bhubaneswar",
        state: "Odisha",
        latitude: 20.2380,
        longitude: 85.8360,
        image: "Lingaraj-Temple-min.jpg",
        type: "Temple",
        unesco: false,
        rating: 4.7
    },
    {
        id: 3,
        name: "Jagannath Temple Puri",
        description: "One of the four sacred Char Dham pilgrimage sites",
        city: "Puri",
        state: "Odisha",
        latitude: 19.8048,
        longitude: 85.8182,
        image: "jagannathtemple.jpg",
        type: "Temple",
        unesco: false,
        rating: 4.9
    },
    {
        id: 4,
        name: "Udayagiri Caves",
        description: "Ancient Jain rock-cut caves with intricate carvings",
        city: "Bhubaneswar",
        state: "Odisha",
        latitude: 20.2623,
        longitude: 85.7792,
        image: "udaigiri.jpg",
        type: "Cave",
        unesco: false,
        rating: 4.5
    },
    {
        id: 5,
        name: "Rajarani Temple",
        description: "11th-century Hindu temple built in Pancha Ratha style",
        city: "Bhubaneswar",
        state: "Odisha",
        latitude: 20.2500,
        longitude: 85.8320,
        image: "rajarani-temple-th-century-hindu-temple-built-pancha-ratha-style-rajarani-temple-th-century-hindu-temple-built-251379169.jpg",
        type: "Temple",
        unesco: false,
        rating: 4.6
    }
];

// Helper function to convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
}

// GET /api/monuments - Get all monuments
router.get('/', (req, res) => {
    res.json({
        success: true,
        count: monuments.length,
        data: monuments
    });
});

// GET /api/monuments/nearby - Get nearby monuments based on user location
router.get('/nearby', (req, res) => {
    const { latitude, longitude, radius = 100 } = req.query;
    
    // Validation
    if (!latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required'
        });
    }
    
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const searchRadius = parseFloat(radius);
    
    // Validate coordinates
    if (isNaN(userLat) || isNaN(userLon) || isNaN(searchRadius)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid coordinates or radius'
        });
    }
    
    // Calculate distance for each monument
    const monumentsWithDistance = monuments.map(monument => {
        const distance = calculateDistance(
            userLat,
            userLon,
            monument.latitude,
            monument.longitude
        );
        
        return {
            ...monument,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            distanceText: `${Math.round(distance)} km away`
        };
    });
    
    // Filter monuments within radius
    const nearbyMonuments = monumentsWithDistance.filter(
        m => m.distance <= searchRadius
    );
    
    // Sort by distance (closest first)
    nearbyMonuments.sort((a, b) => a.distance - b.distance);
    
    res.json({
        success: true,
        userLocation: {
            latitude: userLat,
            longitude: userLon
        },
        searchRadius: `${searchRadius} km`,
        count: nearbyMonuments.length,
        data: nearbyMonuments
    });
});

// GET /api/monuments/stats - Get monument statistics
router.get('/stats', (req, res) => {
    const unescoCount = monuments.filter(m => m.unesco).length;
    const avgRating = monuments.reduce((sum, m) => sum + m.rating, 0) / monuments.length;
    
    res.json({
        success: true,
        data: {
            total_monuments: monuments.length,
            unesco_sites: unescoCount,
            temples: monuments.filter(m => m.type === 'Temple').length,
            caves: monuments.filter(m => m.type === 'Cave').length,
            avg_rating: Math.round(avgRating * 10) / 10
        }
    });
});

// GET /api/monuments/:id - Get single monument by ID
router.get('/:id', (req, res) => {
    const monument = monuments.find(m => m.id === parseInt(req.params.id));
    
    if (!monument) {
        return res.status(404).json({
            success: false,
            message: 'Monument not found'
        });
    }
    
    res.json({
        success: true,
        data: monument
    });
});

module.exports = router;
