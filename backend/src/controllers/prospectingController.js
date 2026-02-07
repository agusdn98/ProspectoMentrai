const organizationService = require('../services/apollo/organizationService');
const peopleService = require('../services/apollo/peopleService');
const enrichmentService = require('../services/apollo/enrichmentService');
const scoringService = require('../services/scoringService');
const braveSearchService = require('../services/openWeb/braveSearchService');
const conversationalSearchService = require('../services/openWeb/conversationalSearchService');
const prisma = require('../config/database');
const logger = require('../utils/logger');
const { ACTIVITY_TYPES } = require('../config/constants');

/**
 * AI Finder: Búsqueda inteligente de empresas
 * POST /api/prospecting/search/companies
 */
exports.searchCompanies = async (req, res, next) => {
  try {
    const {
      industries,
      companySizes,
      locations,
      technologies,
      fundingStages,
      keywords,
      page = 1,
      perPage = 20
    } = req.body;

    // Buscar en Apollo (CONSUME CRÉDITOS)
    const result = await organizationService.searchOrganizations({
      industries,
      companySizes,
      locations,
      technologies,
      fundingStages,
      keywords,
      page,
      perPage
    });

    // Calcular scores para cada empresa
    const companiesWithScores = result.organizations.map(org => {
      const companyData = {
        industry: org.industry,
        companySize: getEmployeeRange(org.estimated_num_employees),
        fundingStage: org.funding_stage,
        technologiesUsed: org.technologies || [],
        growthSignals: extractGrowthSignals(org)
      };

      const idealCustomerScore = scoringService.calculateCompanyScore(companyData);

      return {
        apolloId: org.id,
        name: org.name,
        domain: org.primary_domain,
        websiteUrl: org.website_url,
        linkedinUrl: org.linkedin_url,
        industry: org.industry,
        companySize: getEmployeeRange(org.estimated_num_employees),
        employeeCount: org.estimated_num_employees,
        location: `${org.city || ''}, ${org.country || ''}`.trim(),
        locationCity: org.city,
        locationCountry: org.country,
        fundingStage: org.funding_stage,
        totalFunding: org.total_funding,
        technologiesUsed: org.technologies || [],
        growthSignals: extractGrowthSignals(org),
        idealCustomerScore,
        logoUrl: org.logo_url
      };
    });

    // Ordenar por score
    companiesWithScores.sort((a, b) => b.idealCustomerScore - a.idealCustomerScore);

    res.json({
      success: true,
      data: {
        companies: companiesWithScores,
        pagination: result.pagination,
        creditsUsed: result.creditsUsed
      }
    });

  } catch (error) {
    logger.error('Error in searchCompanies:', error);
    next(error);
  }
};

/**
 * AI Finder (Open Web): Búsqueda de empresas con Brave Search
 * POST /api/prospecting/search/open-web
 */
exports.searchCompaniesOpenWeb = async (req, res, next) => {
  try {
    const {
      industries,
      companySizes,
      locations,
      technologies,
      fundingStages,
      keywords,
      page = 1,
      perPage = 10,
      includeContacts = true,
    } = req.body;

    const result = await braveSearchService.searchCompaniesOpenWeb({
      industries,
      companySizes,
      locations,
      technologies,
      fundingStages,
      keywords,
      page,
      perPage,
      includeContacts,
    });

    res.json({
      success: true,
      data: {
        companies: result.companies,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error('Error in searchCompaniesOpenWeb:', error);
    next(error);
  }
};

/**
 * Conversational AI Search: Chat-based company discovery
 * POST /api/prospecting/search/chat
 */
exports.conversationalSearch = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user?.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty'
      });
    }

    const result = await conversationalSearchService.conversationalSearch(
      message,
      conversationHistory
    );

    // Log search activity when the model exists and user is known
    if (userId && result.companies && result.companies.length > 0 && prisma.searchActivity?.create) {
      await prisma.searchActivity.create({
        data: {
          userId,
          searchType: 'conversational-open-web',
          query: message,
          criteria: result.criteria,
          resultCount: result.companies.length,
          results: {
            companies: result.companies.map(c => ({
              name: c.name,
              domain: c.domain,
              industry: c.industry
            }))
          }
        }
      }).catch(err => logger.warn('Could not log search activity:', err.message));
    }

    res.json({
      success: true,
      data: {
        message: result.message,
        companies: result.companies,
        criteria: result.criteria,
        conversationHistory: result.conversationHistory
      }
    });
  } catch (error) {
    logger.error('Error in conversationalSearch:', error);
    next(error);
  }
};
exports.addCompany = async (req, res, next) => {
  try {
    const { domain, apolloId } = req.body;
    const userId = req.user?.userId;

    // Verificar si ya existe
    let company = await prisma.company.findUnique({ where: { domain } });

    if (company) {
      return res.status(400).json({ 
        success: false,
        error: 'Company already exists',
        data: { companyId: company.id }
      });
    }

    // Crear empresa básica
    company = await prisma.company.create({
      data: {
        domain,
        companyName: domain.split('.')[0], // Temporal
        enrichmentStatus: 'pending',
        apolloId,
        teamId: req.user?.teamId
      }
    });

    // Trigger enriquecimiento en background (no blocking)
    setImmediate(() => {
      enrichmentService.enrichCompanyComplete(company.id, userId)
        .catch(error => {
          logger.error('Background enrichment failed:', error);
        });
    });

    res.status(201).json({
      success: true,
      message: 'Company added. Enrichment in progress...',
      data: {
        company: {
          id: company.id,
          domain: company.domain,
          enrichmentStatus: 'pending'
        }
      }
    });

  } catch (error) {
    logger.error('Error in addCompany:', error);
    next(error);
  }
};

/**
 * Obtener contactos de una empresa
 * GET /api/prospecting/companies/:companyId/contacts
 */
exports.getCompanyContacts = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { enrichEmails = false } = req.query;
    const userId = req.user?.userId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { 
        contacts: {
          orderBy: { relevanceScore: 'desc' }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    // Si se pide enriquecer emails y hay contactos sin email
    if (enrichEmails === 'true') {
      const contactsWithoutEmail = company.contacts
        .filter(c => !c.email && c.enrichmentStatus !== 'completed')
        .slice(0, 10); // Máximo 10 por request

      if (contactsWithoutEmail.length > 0) {
        await enrichmentService.bulkEnrichContactEmails(
          contactsWithoutEmail.map(c => c.id),
          userId
        );

        // Re-fetch contactos actualizados
        const updatedCompany = await prisma.company.findUnique({
          where: { id: companyId },
          include: { 
            contacts: {
              orderBy: { relevanceScore: 'desc' }
            }
          }
        });

        return res.json({
          success: true,
          data: {
            company: updatedCompany,
            contacts: updatedCompany.contacts,
            emailsEnriched: contactsWithoutEmail.length
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        company,
        contacts: company.contacts
      }
    });

  } catch (error) {
    logger.error('Error in getCompanyContacts:', error);
    next(error);
  }
};

/**
 * Buscar contactos específicos
 * POST /api/prospecting/search/contacts
 */
exports.searchContacts = async (req, res, next) => {
  try {
    const {
      jobTitles,
      seniorities,
      locations,
      companyDomains,
      keywords,
      page = 1,
      perPage = 20
    } = req.body;

    const result = await peopleService.searchPeople({
      jobTitles,
      seniorities,
      locations,
      companyDomains,
      keywords,
      page,
      perPage
    });

    res.json({
      success: true,
      data: {
        contacts: result.people,
        pagination: result.pagination
      }
    });

  } catch (error) {
    logger.error('Error in searchContacts:', error);
    next(error);
  }
};

/**
 * Enriquecer email de contacto específico
 * POST /api/prospecting/contacts/:contactId/enrich
 */
exports.enrichContactEmail = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const userId = req.user?.userId;

    const enrichedContact = await enrichmentService.enrichContactEmail(contactId, userId);

    if (!enrichedContact) {
      return res.status(404).json({ 
        success: false,
        error: 'Contact not found or enrichment failed' 
      });
    }

    res.json({
      success: true,
      message: 'Contact enriched successfully',
      data: { contact: enrichedContact }
    });

  } catch (error) {
    logger.error('Error in enrichContactEmail:', error);
    next(error);
  }
};

// Helpers
function getEmployeeRange(employeeCount) {
  if (!employeeCount) return null;
  if (employeeCount <= 10) return '1-10';
  if (employeeCount <= 50) return '11-50';
  if (employeeCount <= 200) return '51-200';
  if (employeeCount <= 500) return '201-500';
  if (employeeCount <= 1000) return '501-1000';
  if (employeeCount <= 5000) return '1001-5000';
  if (employeeCount <= 10000) return '5001-10000';
  return '10000+';
}

function extractGrowthSignals(org) {
  const signals = [];
  
  if (org.latest_funding_round_date) {
    const fundingDate = new Date(org.latest_funding_round_date);
    const monthsAgo = (Date.now() - fundingDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo <= 24) {
      signals.push('Recent funding');
    }
  }
  
  if (['Series A', 'Series B', 'Series C', 'Growth'].includes(org.funding_stage)) {
    signals.push('Growth stage');
  }
  
  if (org.num_current_jobs > 0) {
    signals.push(`${org.num_current_jobs} job openings`);
  }
  
  return signals;
}

module.exports = exports;
