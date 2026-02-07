const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companiesController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', companiesController.getCompanies);
router.get('/:id', companiesController.getCompanyById);
router.post('/', companiesController.createCompany);
router.put('/:id', companiesController.updateCompany);
router.delete('/:id', companiesController.deleteCompany);
router.post('/:id/enrich', companiesController.enrichCompany);

module.exports = router;
