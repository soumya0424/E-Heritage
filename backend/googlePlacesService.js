/**
 * Google Places Service
 * Fetches real hotels and restaurants near monuments using Google Places API
 */

const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

/**
 * Search nearby places using Google Places API
 * @param {number} latitude - Monument latitude
 * @param {number} longitude - Monument longitude
 * @param {string} type - Place type (lodging for hotels, restaurant for restaurants)
 * @param {number} radius - Search radius in meters (default 5000m = 5km)
 */
async function searchNearbyPlaces(latitude, longitude, type, radius = 5000) {
    try {
        const response = await axios.get(PLACES_API_URL, {
            params: {
                location: `${latitude},${longitude}`,
                radius: radius,
                type: type,
                key: GOOGLE_API_KEY
            }
        });

        if (response.data.status === 'OK') {
            return response.data.results;
        } else if (response.data.status === 'ZERO_RESULTS') {
            return [];
        } else {
            console.error('Google Places API Error:', response.data.status);
            return [];
        }
    } catch (error) {
        console.error('Error calling Google Places API:', error.message);
        return [];
    }
}

/**
 * Get detailed information about a place
 */
async function getPlaceDetails(placeId) {
    try {
        const response = await axios.get(PLACE_DETAILS_URL, {
            params: {
                place_id: placeId,
                fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,price_level,opening_hours,photos',
                key: GOOGLE_API_KEY
            }
        });

        if (response.data.status === 'OK') {
            return response.data.result;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting place details:', error.message);
        return null;
    }
}

/**
 * Find nearby hotels for a monument
 */
async function findNearbyHotels(latitude, longitude, radius = 5000) {
    const places = await searchNearbyPlaces(latitude, longitude, 'lodging', radius);
    
    return places.map((place, index) => ({
        id: index + 1,
        googlePlaceId: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address || 'Address not available',
        type: 'hotel',
        rating: place.rating || 0,
        totalRatings: place.user_ratings_total || 0,
        priceLevel: getPriceRange(place.price_level),
        location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
        },
        distance: calculateDistance(
            latitude, 
            longitude, 
            place.geometry.location.lat, 
            place.geometry.location.lng
        ),
        photo: place.photos && place.photos[0] ? getPhotoUrl(place.photos[0].photo_reference) : null,
        isOpen: place.opening_hours?.open_now
    }));
}

/**
 * Find nearby restaurants for a monument
 */
async function findNearbyRestaurants(latitude, longitude, radius = 5000) {
    const places = await searchNearbyPlaces(latitude, longitude, 'restaurant', radius);
    
    return places.map((place, index) => ({
        id: index + 1,
        googlePlaceId: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address || 'Address not available',
        type: 'restaurant',
        cuisine: place.types ? extractCuisineType(place.types) : 'Multi-Cuisine',
        rating: place.rating || 0,
        totalRatings: place.user_ratings_total || 0,
        priceLevel: getPriceRange(place.price_level),
        location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
        },
        distance: calculateDistance(
            latitude, 
            longitude, 
            place.geometry.location.lat, 
            place.geometry.location.lng
        ),
        photo: place.photos && place.photos[0] ? getPhotoUrl(place.photos[0].photo_reference) : null,
        isOpen: place.opening_hours?.open_now
    }));
}

/**
 * Get photo URL from photo reference
 */
function getPhotoUrl(photoReference, maxWidth = 400) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

/**
 * Convert Google price_level (0-4) to readable range
 */
function getPriceRange(priceLevel) {
    const ranges = {
        0: 'Free',
        1: '₹500-1500',
        2: '₹1500-3000',
        3: '₹3000-6000',
        4: '₹6000+'
    };
    return ranges[priceLevel] || 'Price not available';
}

/**
 * Extract cuisine type from place types array
 */
function extractCuisineType(types) {
    const cuisineMap = {
        'indian_restaurant': 'Indian',
        'chinese_restaurant': 'Chinese',
        'italian_restaurant': 'Italian',
        'mexican_restaurant': 'Mexican',
        'japanese_restaurant': 'Japanese',
        'cafe': 'Cafe',
        'bar': 'Bar & Grill',
        'bakery': 'Bakery'
    };

    for (const type of types) {
        if (cuisineMap[type]) {
            return cuisineMap[type];
        }
    }
    
    return 'Multi-Cuisine';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

module.exports = {
    findNearbyHotels,
    findNearbyRestaurants,
    getPlaceDetails
};
