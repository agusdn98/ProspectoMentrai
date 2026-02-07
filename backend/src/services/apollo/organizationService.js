const apolloClient = require('./apolloClient');
const logger = require('../../utils/logger');

/**
 * Búsqueda de empresas en Apollo
 * Este endpoint CONSUME CRÉDITOS
 */
exports.searchOrganizations = async (filters) => {
  try {
    const payload = {
      page: filters.page || 1,
      per_page: Math.min(filters.perPage || 20, 100), // Max 100
      organization_num_employees_ranges: filters.companySizes || [],
      organization_locations: filters.locations || [],
      q_organization_keyword_tags: filters.technologies || [],
      organization_not_null: ['linkedin_url'], // Solo empresas con LinkedIn
    };

    // Filtro de industrias (Apollo usa IDs específicos)
    if (filters.industries && filters.industries.length > 0) {
      payload.organization_industry_tag_ids = filters.industries;
    }

    // Filtro de funding stage
    if (filters.fundingStages && filters.fundingStages.length > 0) {
      payload.prospected_by_current_team = filters.fundingStages;
    }

    // Filtro por keywords
    if (filters.keywords) {
      payload.q_organization_keyword_tags = filters.keywords;
    }

    const response = await apolloClient.post('/mixed_companies/search', payload);

    return {
      organizations: response.data.organizations || [],
      pagination: {
        page: response.data.pagination.page,
        perPage: response.data.pagination.per_page,
        totalPages: response.data.pagination.total_pages,
        totalEntries: response.data.pagination.total_entries
      },
      creditsUsed: response.data.breadcrumbs?.total_result_count || 0
    };
  } catch (error) {
    logger.error('Error searching organizations:', error.message);
    throw error;
  }
};

/**
 * Enriquecer datos de una empresa
 * Este endpoint CONSUME CRÉDITOS
 */
exports.enrichOrganization = async (domain) => {
  try {
    const response = await apolloClient.get('/organizations/enrich', {
      params: { domain }
    });

    const org = response.data.organization;

    if (!org) {
      return null;
    }

    return {
      id: org.id,
      name: org.name,
      domain: org.primary_domain,
      websiteUrl: org.website_url,
      linkedinUrl: org.linkedin_url,
      industry: org.industry,
      subIndustry: org.sub_industry,
      companySize: getEmployeeRange(org.estimated_num_employees),
      employeeCount: org.estimated_num_employees,
      foundedYear: org.founded_year,
      description: org.short_description,
      
      // Funding info
      fundingStage: org.funding_stage,
      totalFunding: org.total_funding ? parseFloat(org.total_funding) : null,
      latestFundingRound: org.latest_funding_round_date,
      latestFundingAmount: org.latest_funding_stage_amount ? parseFloat(org.latest_funding_stage_amount) : null,
      
      // Location
      locationCity: org.city,
      locationState: org.state,
      locationCountry: org.country,
      
      // Technologies
      technologiesUsed: org.technologies || [],
      
      // Contact info
      phone: org.phone,
      
      // Logo
      logoUrl: org.logo_url,
      
      // Señales de crecimiento
      growthSignals: extractGrowthSignals(org),
      
      // Metadata
      apolloId: org.id,
      lastEnrichedAt: new Date()
    };
  } catch (error) {
    logger.error('Error enriching organization:', error.message);
    throw error;
  }
};

/**
 * Obtener información específica de una empresa por ID
 */
exports.getOrganizationById = async (organizationId) => {
  try {
    const response = await apolloClient.get(`/organizations/${organizationId}`);
    return response.data.organization;
  } catch (error) {
    logger.error('Error getting organization:', error.message);
    throw error;
  }
};

// Helper: Convertir número de empleados a rango
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

// Helper: Extraer señales de crecimiento
function extractGrowthSignals(org) {
  const signals = [];
  
  // Recent funding
  if (org.latest_funding_round_date) {
    const fundingDate = new Date(org.latest_funding_round_date);
    const monthsAgo = (Date.now() - fundingDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo <= 24) {
      signals.push('Recent funding (last 24 months)');
    }
  }
  
  // Growth stage
  if (['Series A', 'Series B', 'Series C', 'Series D', 'Growth'].includes(org.funding_stage)) {
    signals.push('Growth stage company');
  }
  
  // Hiring indicators
  if (org.num_current_jobs > 0) {
    signals.push(`${org.num_current_jobs} active job postings`);
  }
  
  // Revenue growth
  if (org.estimated_num_employees > 50) {
    signals.push('Scaling team');
  }

  // Recent expansion
  if (org.seo_description && org.seo_description.toLowerCase().includes('hiring')) {
    signals.push('Actively hiring');
  }
  
  return signals;
}

module.exports = exports;
