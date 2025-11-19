const express = require('express');
const router = express.Router();
const monumentController = require('./monumentController');
const auth = require('./auth');
const validation = require('./validation');

// Public routes
router.get('/', monumentController.getAllMonuments);
router.get('/stats', monumentController.getStats);
router.get('/search', validation.validateGeolocation, monumentController.searchMonuments);
router.get('/nearby', validation.validateGeolocation, monumentController.getNearbyMonuments);
router.get('/city/:city', monumentController.getMonumentsByCity);
router.get('/:id', validation.validateId, monumentController.getMonumentById);

// Protected routes (admin only)
router.post('/',
    auth.verifyToken,
    auth.isAdmin,
    validation.validateMonument,
    monumentController.createMonument
);

router.put('/:id',
    auth.verifyToken,
    auth.isAdmin,
    validation.validateId,
    validation.validateMonument,
    monumentController.updateMonument
);

router.delete('/:id',
    auth.verifyToken,
    auth.isAdmin,
    validation.validateId,
    monumentController.deleteMonument
);

module.exports = router;
