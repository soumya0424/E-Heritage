const axios = require('axios');
const config = require('./config');

class TravelService {
    // Get nearby hotels using Google Places API
    async getNearbyHotels(latitude, longitude, radius = 5000) {
        try {
            if (!config.api.googleMaps) {
                console.warn('Google Maps API key not configured');
                return [];
            }

            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
                {
                    params: {
                        location: `${latitude},${longitude}`,
                        radius: radius,
                        type: 'lodging',
                        key: config.api.googleMaps
                    },
                    timeout: 10000
                }
            );

            if (response.data.status !== 'OK') {
                console.warn('Google Places API returned:', response.data.status);
                return [];
            }

            return response.data.results.map(hotel => ({
                name: hotel.name,
                address: hotel.vicinity,
                rating: hotel.rating || 'N/A',
                userRatingsTotal: hotel.user_ratings_total || 0,
                priceLevel: hotel.price_level ? '$'.repeat(hotel.price_level) : 'N/A',
                location: {
                    latitude: hotel.geometry.location.lat,
                    longitude: hotel.geometry.location.lng
                },
                photos: hotel.photos ? hotel.photos.map(photo => ({
                    reference: photo.photo_reference,
                    url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${config.api.googleMaps}`
                })) : [],
                placeId: hotel.place_id,
                isOpen: hotel.opening_hours ? hotel.opening_hours.open_now : null
            }));
        } catch (error) {
            console.error('Error fetching hotels:', error.message);
            return [];
        }
    }

    // Get nearby restaurants using Google Places API
    async getNearbyRestaurants(latitude, longitude, radius = 2000) {
        try {
            if (!config.api.googleMaps) {
                console.warn('Google Maps API key not configured');
                return [];
            }

            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
                {
                    params: {
                        location: `${latitude},${longitude}`,
                        radius: radius,
                        type: 'restaurant',
                        key: config.api.googleMaps
                    },
                    timeout: 10000
                }
            );

            if (response.data.status !== 'OK') {
                console.warn('Google Places API returned:', response.data.status);
                return [];
            }

            return response.data.results.map(restaurant => ({
                name: restaurant.name,
                address: restaurant.vicinity,
                rating: restaurant.rating || 'N/A',
                userRatingsTotal: restaurant.user_ratings_total || 0,
                priceLevel: restaurant.price_level ? '$'.repeat(restaurant.price_level) : 'N/A',
                cuisine: restaurant.types.filter(type => 
                    !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(type)
                ).join(', '),
                location: {
                    latitude: restaurant.geometry.location.lat,
                    longitude: restaurant.geometry.location.lng
                },
                placeId: restaurant.place_id,
                isOpen: restaurant.opening_hours ? restaurant.opening_hours.open_now : null
            }));
        } catch (error) {
            console.error('Error fetching restaurants:', error.message);
            return [];
        }
    }

    // Get weather information using OpenWeather API
    async getWeather(latitude, longitude) {
        try {
            if (!config.api.weather) {
                console.warn('Weather API key not configured');
                return null;
            }

            const response = await axios.get(
                'https://api.openweathermap.org/data/2.5/weather',
                {
                    params: {
                        lat: latitude,
                        lon: longitude,
                        appid: config.api.weather,
                        units: 'metric' // Celsius
                    },
                    timeout: 10000
                }
            );

            const data = response.data;

            return {
                temperature: {
                    current: Math.round(data.main.temp),
                    feels_like: Math.round(data.main.feels_like),
                    min: Math.round(data.main.temp_min),
                    max: Math.round(data.main.temp_max)
                },
                condition: {
                    main: data.weather[0].main,
                    description: data.weather[0].description,
                    icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
                },
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                visibility: data.visibility / 1000, // Convert to km
                pressure: data.main.pressure,
                sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                location: data.name,
                country: data.sys.country
            };
        } catch (error) {
            console.error('Error fetching weather:', error.message);
            return null;
        }
    }

    // Get directions using Google Directions API
    async getDirections(origin, destination, mode = 'driving') {
        try {
            if (!config.api.googleMaps) {
                console.warn('Google Maps API key not configured');
                return null;
            }

            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/directions/json',
                {
                    params: {
                        origin: origin,
                        destination: destination,
                        mode: mode, // driving, walking, bicycling, transit
                        key: config.api.googleMaps
                    },
                    timeout: 10000
                }
            );

            if (response.data.status !== 'OK') {
                console.warn('Google Directions API returned:', response.data.status);
                return null;
            }

            const route = response.data.routes[0];
            const leg = route.legs[0];

            return {
                distance: {
                    text: leg.distance.text,
                    value: leg.distance.value // meters
                },
                duration: {
                    text: leg.duration.text,
                    value: leg.duration.value // seconds
                },
                startAddress: leg.start_address,
                endAddress: leg.end_address,
                steps: leg.steps.map(step => ({
                    instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
                    distance: step.distance.text,
                    duration: step.duration.text,
                    travelMode: step.travel_mode
                })),
                overview_polyline: route.overview_polyline.points
            };
        } catch (error) {
            console.error('Error fetching directions:', error.message);
            return null;
        }
    }

    // Calculate distance between two points (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return Math.round(distance * 10) / 10; // Round to 1 decimal place
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
}

module.exports = new TravelService();
