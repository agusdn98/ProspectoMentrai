const claudeClient = require('./claudeClient');
const { validateCriteria } = require('./criteriaExtractor');
const logger = require('../../utils/logger');

class QueryInterpreter {
  async interpret(userQuery) {
    logger.info('AI interpret query', { query: userQuery });
    const criteria = await claudeClient.interpretProspectQuery(userQuery);
    const validated = validateCriteria(criteria);
    logger.info('AI criteria parsed', { criteria: validated });
    return validated;
  }

  summarizeCriteria(criteria) {
    const parts = [];

    if (criteria.jobTitles.length > 0) {
      parts.push(criteria.jobTitles.join(', '));
    }

    if (criteria.departments.length > 0) {
      parts.push(`in ${criteria.departments.join(', ')}`);
    }

    if (criteria.industries.length > 0) {
      parts.push(`at ${criteria.industries.join(', ')} companies`);
    }

    if (criteria.locations.length > 0) {
      parts.push(`located in ${criteria.locations.join(', ')}`);
    }

    if (criteria.companySizes.length > 0) {
      parts.push(`with ${criteria.companySizes.join(' or ')} employees`);
    }

    if (criteria.fundingStages.length > 0) {
      parts.push(`at ${criteria.fundingStages.join('/')} stage`);
    }

    return parts.join(' ');
  }
}

module.exports = new QueryInterpreter();
