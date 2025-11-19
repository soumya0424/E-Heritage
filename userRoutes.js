const express = require('express');
const router = express.Router();
const userController = require('./userController');
const auth = require('./auth');
const validation = require('./validation');

// Public routes
router.post('/register', 
    validation.validateUserRegistration, 
    userController.register
);

router.post('/login', 
    validation.validateUserLogin, 
    userController.login
);

// Protected routes (authenticated users)
router.get('/profile', 
    auth.verifyToken, 
    userController.getProfile
);

router.put('/profile', 
    auth.verifyToken, 
    userController.updateProfile
);

router.post('/change-password', 
    auth.verifyToken, 
    userController.changePassword
);

// Favorites routes
router.get('/favorites', 
    auth.verifyToken, 
    userController.getFavorites
);

router.post('/favorites/:monumentId', 
    auth.verifyToken, 
    validation.validateId, 
    userController.addFavorite
);

router.delete('/favorites/:monumentId', 
    auth.verifyToken, 
    validation.validateId, 
    userController.removeFavorite
);

router.get('/favorites/:monumentId/check', 
    auth.verifyToken, 
    validation.validateId, 
    userController.checkFavorite
);

module.exports = router;
