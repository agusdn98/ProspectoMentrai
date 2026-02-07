const peopleService = require('./peopleService');
const logger = require('../../utils/logger');

const BATCH_SIZE = 10;

async function enrichProspects(prospects) {
  const enriched = [];

  for (let i = 0; i < prospects.length; i += BATCH_SIZE) {
    const batch = prospects.slice(i, i + BATCH_SIZE);
    const details = batch.map((prospect) => ({
      firstName: prospect.contact?.first_name || prospect.contact?.firstName,
      lastName: prospect.contact?.last_name || prospect.contact?.lastName,
      companyName: prospect.company?.name || prospect.company?.companyName,
      companyDomain: prospect.company?.primary_domain || prospect.company?.domain
    }));

    try {
      const matches = await peopleService.bulkEnrichPeople(details);

      batch.forEach((prospect, index) => {
        const match = matches[index]?.person;
        if (match) {
          prospect.contact = {
            ...prospect.contact,
            email: match.email || prospect.contact.email,
            phone: match.phone_numbers?.[0]?.sanitized_number || prospect.contact.phone,
            emailVerified: match.email_status === 'verified',
            personalEmails: match.personal_emails || prospect.contact.personalEmails || []
          };
        }
        enriched.push(prospect);
      });
    } catch (error) {
      logger.warn('Batch enrichment failed', { error: error.message });
      enriched.push(...batch);
    }
  }

  return enriched;
}

module.exports = {
  enrichProspects
};
