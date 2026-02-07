function formatProspect(prospect) {
  const company = prospect.company || {};
  const contact = prospect.contact || {};

  return {
    companyId: company.id || null,
    companyName: company.name || company.companyName || null,
    companyDomain: company.primary_domain || company.domain || null,
    companyIndustry: company.industry || null,
    companySize: company.companySize || null,
    companyLocation: company.location || [company.city, company.country].filter(Boolean).join(', '),
    companyFunding: company.funding_stage || company.fundingStage || null,
    companyWebsite: company.website_url || company.websiteUrl || null,
    companyLinkedIn: company.linkedin_url || company.linkedinUrl || null,

    contactId: contact.id || null,
    contactFirstName: contact.first_name || contact.firstName || null,
    contactLastName: contact.last_name || contact.lastName || null,
    contactFullName: contact.name || contact.fullName || null,
    contactTitle: contact.title || contact.jobTitle || null,
    contactSeniority: contact.seniority || null,
    contactEmail: contact.email || null,
    contactPhone: contact.phone || null,
    contactEmailVerified: contact.emailVerified || false,
    contactLinkedIn: contact.linkedin_url || contact.linkedinUrl || null,

    matchScore: prospect.matchScore || 0,
    matchReasons: prospect.matchReasons || []
  };
}

function formatResponse(result, summary) {
  return {
    success: true,
    query: result.query,
    summary,
    criteria: result.criteria,
    stats: {
      totalFound: result.totalFound,
      returned: result.prospects.length
    },
    prospects: result.prospects.map(formatProspect)
  };
}

module.exports = {
  formatProspect,
  formatResponse
};
