const prisma = require('../config/database');
const scoringService = require('../services/scoringService');
const enrichmentService = require('../services/apollo/enrichmentService');
const logger = require('../utils/logger');
const {  NotFoundError } = require('../middleware/errorHandler');

/**
 * Get all companies with filters
 * GET /api/companies
 */
exports.getCompanies = async (req, res, next) => {
  try {
    const {
      industry,
      companySize,
      locationCountry,
      minScore,
      page = 1,
      limit = 20,
      sortBy = 'idealCustomerScore',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (industry) where.industry = industry;
    if (companySize) where.companySize = companySize;
    if (locationCountry) where.locationCountry = locationCountry;
    if (minScore) where.idealCustomerScore = { gte: parseInt(minScore) };
    
    // Filter by team if user has teamId
    if (req.user?.teamId) {
      where.teamId = req.user.teamId;
    }

    where.deletedAt = null; // Exclude soft-deleted

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          contacts: {
            where: { relevantForOutreach: true },
            take: 5,
            orderBy: { relevanceScore: 'desc' }
          },
          _count: {
            select: { contacts: true }
          }
        }
      }),
      prisma.company.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching companies:', error);
    next(error);
  }
};

/**
 * Get company by ID
 * GET /api/companies/:id
 */
exports.getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findFirst({
      where: { 
        id,
        deletedAt: null
      },
      include: {
        contacts: {
          orderBy: { relevanceScore: 'desc' }
        },
        activities: {
          take: 10,
          orderBy: { performedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: { 
            contacts: true,
            listCompanies: true 
          }
        }
      }
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    res.json({
      success: true,
      data: { company }
    });
  } catch (error) {
    logger.error('Error fetching company:', error);
    next(error);
  }
};

/**
 * Create new company
 * POST /api/companies
 */
exports.createCompany = async (req, res, next) => {
  try {
    const companyData = req.body;

    // Calculate ideal customer score
    const idealCustomerScore = scoringService.calculateCompanyScore(companyData);

    const company = await prisma.company.create({
      data: {
        ...companyData,
        idealCustomerScore,
        teamId: req.user?.teamId
      }
    });

    logger.info(`Company created: ${company.companyName}`);

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: { company }
    });
  } catch (error) {
    logger.error('Error creating company:', error);
    next(error);
  }
};

/**
 * Update company
 * PUT /api/companies/:id
 */
exports.updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Recalculate score if relevant fields changed
    if (updateData.industry || updateData.companySize || updateData.fundingStage) {
      const company = await prisma.company.findUnique({ where: { id } });
      if (company) {
        updateData.idealCustomerScore = scoringService.calculateCompanyScore({
          ...company,
          ...updateData
        });
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData
    });

    logger.info(`Company updated: ${company.companyName}`);

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: { company }
    });
  } catch (error) {
    logger.error('Error updating company:', error);
    next(error);
  }
};

/**
 * Delete company (soft delete)
 * DELETE /api/companies/:id
 */
exports.deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    logger.info(`Company soft-deleted: ${id}`);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting company:', error);
    next(error);
  }
};

/**
 * Enrich company data
 * POST /api/companies/:id/enrich
 */
exports.enrichCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Trigger enrichment (non-blocking)
    setImmediate(() => {
      enrichmentService.enrichCompanyComplete(id, userId)
        .catch(error => {
          logger.error('Enrichment failed:', error);
        });
    });

    res.json({
      success: true,
      message: 'Company enrichment started'
    });
  } catch (error) {
    logger.error('Error enriching company:', error);
    next(error);
  }
};

module.exports = exports;
