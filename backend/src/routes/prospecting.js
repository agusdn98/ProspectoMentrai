const express = require('express');
const router = express.Router();
const prospectingController = require('../controllers/prospectingController');
const { authenticate } = require('../middleware/auth');

// All prospecting routes require authentication
router.use(authenticate);

// Search
router.post('/search/companies', prospectingController.searchCompanies);
router.post('/search/contacts', prospectingController.searchContacts);
router.post('/search/open-web', prospectingController.searchCompaniesOpenWeb);
router.post('/search/chat', prospectingController.conversationalSearch);

// Companies
router.post('/companies', prospectingController.addCompany);
router.get('/companies/:companyId/contacts', prospectingController.getCompanyContacts);

// Contacts
router.post('/contacts/:contactId/enrich', prospectingController.enrichContactEmail);

module.exports = router;
