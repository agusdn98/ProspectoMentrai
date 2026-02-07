const express = require('express');
const router = express.Router();
const listsController = require('../controllers/listsController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', listsController.getLists);
router.get('/:id', listsController.getListById);
router.post('/', listsController.createList);
router.put('/:id', listsController.updateList);
router.delete('/:id', listsController.deleteList);

// Companies in list
router.post('/:id/companies', listsController.addCompaniesToList);
router.delete('/:id/companies', listsController.removeCompaniesFromList);

// Contacts in list
router.post('/:id/contacts', listsController.addContactsToList);

module.exports = router;
