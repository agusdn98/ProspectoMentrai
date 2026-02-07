const express = require('express');
const router = express.Router();
const aiSearchController = require('../controllers/aiSearchController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', aiSearchController.search);
router.get('/suggestions', aiSearchController.getSuggestions);
router.post('/save-prospects', aiSearchController.saveProspects);

module.exports = router;
