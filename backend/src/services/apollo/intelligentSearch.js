const organizationService = require('./organizationService');
const peopleService = require('./peopleService');
const queryInterpreter = require('../ai/queryInterpreter');
const prospectScorer = require('../prospecting/prospectScorer');
const prospectRanker = require('../prospecting/prospectRanker');
const { enrichProspects } = require('./batchEnrichment');
const logger = require('../../utils/logger');

class IntelligentSearch {
  async search(userQuery, options = {}) {
    const criteria = await queryInterpreter.interpret(userQuery);

    const companies = await this.searchCompanies(criteria, { limit: options.companyLimit || 50 });

    const allProspects = [];
    for (const company of companies) {
      const contacts = await this.searchContactsForCompany(company, criteria);
      contacts.forEach((contact) => {
        allProspects.push({
          company,
          contact,
          matchScore: 0,
          matchReasons: []
        });
      });
    }

    const scoredProspects = allProspects.map((prospect) => {
      const scoreResult = prospectScorer.calculateProspectScore(prospect, criteria);
      return {
        ...prospect,
        matchScore: scoreResult.score,
        matchReasons: scoreResult.reasons
      };
    });

    const rankedProspects = prospectRanker.rank(scoredProspects, options.limit || 30);
    const enrichedProspects = await enrichProspects(rankedProspects);

    return {
      query: userQuery,
      criteria,
      totalFound: allProspects.length,
      prospects: enrichedProspects
    };
  }

  async searchCompanies(criteria, options = {}) {
    const mappedIndustryIds = mapIndustriesToIds(criteria.industries || []);

    const response = await organizationService.searchOrganizations({
      industries: mappedIndustryIds,
      companySizes: criteria.companySizes,
      locations: criteria.locations,
      technologies: criteria.technologies,
      keywords: criteria.keywords,
      page: 1,
      perPage: options.limit || 50
    });

    return response.organizations || [];
  }

  async searchContactsForCompany(company, criteria) {
    const domains = company.primary_domain || company.domain ? [company.primary_domain || company.domain] : [];

    if (domains.length === 0) {
      return [];
    }

    try {
      const response = await peopleService.searchPeople({
        page: 1,
        perPage: 10,
        companyDomains: domains,
        jobTitles: criteria.jobTitles,
        seniorities: criteria.seniorities,
        locations: criteria.locations
      });

      return response.people || [];
    } catch (error) {
      logger.warn('Contact search failed', { company: company.primary_domain || company.domain, error: error.message });
      return [];
    }
  }
}

function mapIndustriesToIds(industries) {
  const industryMap = {
    SaaS: ['5567cd4773696439b10b0000'],
    Technology: ['5567cd4773696439b10b0000', '5567cd4773696439b10c0000'],
    'E-commerce': ['5567cd4773696439b10d0000'],
    FinTech: ['5567cd4773696439b10e0000'],
    Healthcare: ['5567cd4773696439b10f0000'],
    'Professional Services': ['5567cd4773696439b1100000'],
    Manufacturing: ['5567cd4773696439b1110000'],
    Retail: ['5567cd4773696439b1120000'],
    Education: ['5567cd4773696439b1130000'],
    'Real Estate': ['5567cd4773696439b1140000']
  };

  const ids = [];
  industries.forEach((industry) => {
    if (industryMap[industry]) {
      ids.push(...industryMap[industry]);
    }
  });

  return [...new Set(ids)];
}

module.exports = new IntelligentSearch();
