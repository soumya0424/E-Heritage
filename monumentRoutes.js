const express = require('express');
const router = express.Router();
const monumentController = require('../controllers/monumentController');
const auth = require('../middleware/auth');

router.get('/', monumentController.getAllMonuments);
router.get('/:id', monumentController.getMonumentById);

// Routes needing admin role can be protected like this:
// router.post('/', auth.verifyToken, auth.isAdmin, monumentController.createMonument);

module.exports = router;
