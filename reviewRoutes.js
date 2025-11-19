const express = require('express');
const router = express.Router();
const reviewController = require('./reviewController');
const auth = require('./auth');
const validation = require('./validation');

// Public routes
router.get('/monument/:monumentId', 
    validation.validateId, 
    reviewController.getMonumentReviews
);

// Protected routes (authenticated users)
router.get('/my-reviews', 
    auth.verifyToken, 
    reviewController.getUserReviews
);

router.post('/monument/:monumentId', 
    auth.verifyToken, 
    validation.validateId,
    validation.validateReview,
    reviewController.createReview
);

router.put('/:id', 
    auth.verifyToken, 
    validation.validateId,
    validation.validateReview,
    reviewController.updateReview
);

router.delete('/:id', 
    auth.verifyToken, 
    validation.validateId,
    reviewController.deleteReview
);

router.post('/:id/helpful', 
    validation.validateId,
    reviewController.markHelpful
);

module.exports = router;
