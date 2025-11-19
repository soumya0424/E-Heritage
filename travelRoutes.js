const express = require('express');
const router = express.Router();
const travelController = require('./travelController');
const validation = require('./validation');

// Get all travel services for a monument
router.get('/monument/:monumentId', 
    validation.validateId,
    travelController.getNearbyServices
);

// Get hotels near monument
router.get('/hotels/:monumentId', 
    validation.validateId,
    travelController.getNearbyHotels
);

// Get restaurants near monument
router.get('/restaurants/:monumentId', 
    validation.validateId,
    travelController.getNearbyRestaurants
);

// Get weather for monument location
router.get('/weather/:monumentId', 
    validation.validateId,
    travelController.getWeather
);

// Get directions to monument
router.get('/directions', 
    travelController.getDirections
);

module.exports = router;
