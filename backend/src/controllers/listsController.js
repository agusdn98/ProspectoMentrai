const prisma = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../middleware/errorHandler');

/**
 * Get all lists
 * GET /api/lists
 */
exports.getLists = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const lists = await prisma.list.findMany({
      where: {
        createdBy: userId,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            listCompanies: true,
            listContacts: true,
            campaigns: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { lists }
    });
  } catch (error) {
    logger.error('Error fetching lists:', error);
    next(error);
  }
};

/**
 * Get list by ID
 * GET /api/lists/:id
 */
exports.getListById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const list = await prisma.list.findFirst({
      where: {
        id,
        createdBy: userId,
        deletedAt: null
      },
      include: {
        listCompanies: {
          include: {
            company: {
              include: {
                _count: {
                  select: { contacts: true }
                }
              }
            }
          }
        },
        listContacts: {
          include: {
            contact: {
              include: {
                company: true
              }
            }
          }
        },
        campaigns: {
          select: {
            id: true,
            campaignName: true,
            status: true,
            totalContacts: true
          }
        }
      }
    });

    if (!list) {
      throw new NotFoundError('List');
    }

    res.json({
      success: true,
      data: { list }
    });
  } catch (error) {
    logger.error('Error fetching list:', error);
    next(error);
  }
};

/**
 * Create new list
 * POST /api/lists
 */
exports.createList = async (req, res, next) => {
  try {
    const { listName, listDescription, listType, filtersUsed } = req.body;
    const userId = req.user.userId;

    const list = await prisma.list.create({
      data: {
        listName,
        listDescription,
        listType: listType || 'custom',
        filtersUsed,
        createdBy: userId
      }
    });

    logger.info(`List created: ${listName} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'List created successfully',
      data: { list }
    });
  } catch (error) {
    logger.error('Error creating list:', error);
    next(error);
  }
};

/**
 * Update list
 * PUT /api/lists/:id
 */
exports.updateList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { listName, listDescription } = req.body;
    const userId = req.user.userId;

    const list = await prisma.list.updateMany({
      where: {
        id,
        createdBy: userId
      },
      data: {
        listName,
        listDescription
      }
    });

    res.json({
      success: true,
      message: 'List updated successfully'
    });
  } catch (error) {
    logger.error('Error updating list:', error);
    next(error);
  }
};

/**
 * Delete list
 * DELETE /api/lists/:id
 */
exports.deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await prisma.list.updateMany({
      where: {
        id,
        createdBy: userId
      },
      data: {
        deletedAt: new Date()
      }
    });

    logger.info(`List deleted: ${id}`);

    res.json({
      success: true,
      message: 'List deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting list:', error);
    next(error);
  }
};

/**
 * Add companies to list
 * POST /api/lists/:id/companies
 */
exports.addCompaniesToList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyIds } = req.body;
    const userId = req.user.userId;

    // Verify list ownership
    const list = await prisma.list.findFirst({
      where: { id, createdBy: userId }
    });

    if (!list) {
      throw new NotFoundError('List');
    }

    // Add companies (ignore duplicates)
    const operations = companyIds.map(companyId =>
      prisma.listCompany.upsert({
        where: {
          listId_companyId: {
            listId: id,
            companyId
          }
        },
        create: {
          listId: id,
          companyId
        },
        update: {}
      })
    );

    await Promise.all(operations);

    // Update count
    const count = await prisma.listCompany.count({ where: { listId: id } });
    await prisma.list.update({
      where: { id },
      data: { totalCompanies: count }
    });

    logger.info(`Added ${companyIds.length} companies to list ${id}`);

    res.json({
      success: true,
      message: `${companyIds.length} companies added to list`
    });
  } catch (error) {
    logger.error('Error adding companies to list:', error);
    next(error);
  }
};

/**
 * Remove companies from list  
 * DELETE /api/lists/:id/companies
 */
exports.removeCompaniesFromList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyIds } = req.body;

    await prisma.listCompany.deleteMany({
      where: {
        listId: id,
        companyId: { in: companyIds }
      }
    });

    // Update count
    const count = await prisma.listCompany.count({ where: { listId: id } });
    await prisma.list.update({
      where: { id },
      data: { totalCompanies: count }
    });

    res.json({
      success: true,
      message: 'Companies removed from list'
    });
  } catch (error) {
    logger.error('Error removing companies from list:', error);
    next(error);
  }
};

/**
 * Add contacts to list
 * POST /api/lists/:id/contacts
 */
exports.addContactsToList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contactIds } = req.body;
    const userId = req.user.userId;

    // Verify list ownership
    const list = await prisma.list.findFirst({
      where: { id, createdBy: userId }
    });

    if (!list) {
      throw new NotFoundError('List');
    }

    // Add contacts (ignore duplicates)
    const operations = contactIds.map(contactId =>
      prisma.listContact.upsert({
        where: {
          listId_contactId: {
            listId: id,
            contactId
          }
        },
        create: {
          listId: id,
          contactId
        },
        update: {}
      })
    );

    await Promise.all(operations);

    // Update count
    const count = await prisma.listContact.count({ where: { listId: id } });
    await prisma.list.update({
      where: { id },
      data: { totalContacts: count }
    });

    logger.info(`Added ${contactIds.length} contacts to list ${id}`);

    res.json({
      success: true,
      message: `${contactIds.length} contacts added to list`
    });
  } catch (error) {
    logger.error('Error adding contacts to list:', error);
    next(error);
  }
};

module.exports = exports;
