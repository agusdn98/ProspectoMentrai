const apolloClient = require('./apolloClient');
const logger = require('../../utils/logger');

/**
 * Búsqueda de personas en Apollo
 * Este endpoint NO CONSUME CRÉDITOS pero no retorna emails
 */
exports.searchPeople = async (filters) => {
  try {
    const payload = {
      page: filters.page || 1,
      per_page: Math.min(filters.perPage || 20, 100),
      person_titles: filters.jobTitles || [],
      person_seniorities: filters.seniorities || [],
      person_locations: filters.locations || [],
      q_keywords: filters.keywords || null,
    };

    // Filtrar por empresa específica
    if (filters.organizationIds && filters.organizationIds.length > 0) {
      payload.organization_ids = filters.organizationIds;
    }

    // Filtrar por dominio de empresa
    if (filters.companyDomains && filters.companyDomains.length > 0) {
      payload.q_organization_domains = filters.companyDomains.join(',');
    }

    const response = await apolloClient.post('/mixed_people/api_search', payload);

    return {
      people: response.data.people || [],
      pagination: {
        page: response.data.pagination.page,
        perPage: response.data.pagination.per_page,
        totalPages: response.data.pagination.total_pages,
        totalEntries: response.data.pagination.total_entries
      }
    };
  } catch (error) {
    logger.error('Error searching people:', error.message);
    throw error;
  }
};

/**
 * Enriquecer datos de una persona (obtener email y teléfono)
 * Este endpoint CONSUME CRÉDITOS
 */
exports.enrichPerson = async (personData) => {
  try {
    const payload = {
      first_name: personData.firstName,
      last_name: personData.lastName,
      organization_name: personData.companyName,
      domain: personData.companyDomain,
      reveal_personal_emails: true,
      reveal_phone_number: true
    };

    // Si tenemos ID de Apollo, usarlo
    if (personData.apolloId) {
      payload.id = personData.apolloId;
    }

    const response = await apolloClient.post('/people/match', payload);

    const person = response.data.person;

    if (!person) {
      return null;
    }

    return {
      id: person.id,
      firstName: person.first_name,
      lastName: person.last_name,
      fullName: person.name,
      email: person.email,
      personalEmails: person.personal_emails || [],
      emailStatus: person.email_status, // 'verified', 'guessed', etc.
      phone: person.phone_numbers?.[0]?.sanitized_number || null,
      phoneNumbers: person.phone_numbers || [],
      
      // Job info
      jobTitle: person.title,
      department: person.departments?.[0] || null,
      seniority: person.seniority,
      
      // Company
      companyName: person.organization?.name,
      companyDomain: person.organization?.primary_domain,
      companyId: person.organization_id,
      
      // Social
      linkedinUrl: person.linkedin_url,
      twitterUrl: person.twitter_url,
      facebookUrl: person.facebook_url,
      
      // Location
      location: formatLocation(person),
      city: person.city,
      state: person.state,
      country: person.country,
      
      // Metadata
      apolloId: person.id,
      photoUrl: person.photo_url,
      lastEnrichedAt: new Date()
    };
  } catch (error) {
    logger.error('Error enriching person:', error.message);
    throw error;
  }
};

/**
 * Enriquecer múltiples personas en bulk (hasta 10 por request)
 * Este endpoint CONSUME CRÉDITOS
 */
exports.bulkEnrichPeople = async (peopleData) => {
  try {
    const payload = {
      details: peopleData.map(person => ({
        first_name: person.firstName,
        last_name: person.lastName,
        organization_name: person.companyName,
        domain: person.companyDomain
      })),
      reveal_personal_emails: true,
      reveal_phone_number: true
    };

    const response = await apolloClient.post('/people/bulk_match', payload);

    return response.data.matches || [];
  } catch (error) {
    logger.error('Error bulk enriching people:', error.message);
    throw error;
  }
};

/**
 * Obtener contactos de una empresa específica
 */
exports.getContactsByCompany = async (companyDomain, filters = {}) => {
  try {
    // Primero buscar personas sin créditos
    const searchResult = await exports.searchPeople({
      companyDomains: [companyDomain],
      jobTitles: filters.jobTitles || [
        'Chief', 'VP', 'Director', 'Head of',
        'Sales', 'Customer Success', 'HR', 'Talent'
      ],
      seniorities: filters.seniorities || ['senior', 'director', 'vp', 'c_suite'],
      page: filters.page || 1,
      perPage: filters.perPage || 50
    });

    return searchResult.people;
  } catch (error) {
    logger.error('Error getting contacts by company:', error.message);
    throw error;
  }
};

// Helper: Formatear ubicación
function formatLocation(person) {
  const parts = [person.city, person.state, person.country].filter(Boolean);
  return parts.join(', ') || null;
}

module.exports = exports;
