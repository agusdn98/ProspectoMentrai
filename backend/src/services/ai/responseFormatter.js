function formatProspect(prospect) {
  // Handle both nested (Apollo-style) and flat (Claude-style) formats
  const company = prospect.company || prospect;
  const contact = prospect.contact || prospect;

  return {
    companyId: company.id || null,
    companyName: prospect.companyName || company.name || company.companyName || null,
    companyDomain: prospect.companyDomain || company.primary_domain || company.domain || null,
    companyIndustry: prospect.companyIndustry || company.industry || null,
    companySize: prospect.companySize || company.companySize || null,
    companyLocation: prospect.companyLocation || company.location || [company.city, company.country].filter(Boolean).join(', ') || null,
    companyFunding: prospect.companyFunding || company.funding_stage || company.fundingStage || null,
    companyWebsite: company.website_url || company.websiteUrl || null,
    companyLinkedIn: company.linkedin_url || company.linkedinUrl || null,

    contactId: contact.id || null,
    contactFirstName: contact.first_name || contact.firstName || null,
    contactLastName: contact.last_name || contact.lastName || null,
    contactFullName: prospect.contactFullName || contact.name || contact.fullName || null,
    contactTitle: prospect.contactTitle || contact.title || contact.jobTitle || null,
    contactSeniority: contact.seniority || null,
    contactEmail: prospect.contactEmail || contact.email || null,
    contactPhone: prospect.contactPhone || contact.phone || null,
    contactEmailVerified: contact.emailVerified || false,
    contactLinkedIn: prospect.contactLinkedIn || contact.linkedin_url || contact.linkedinUrl || null,

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
