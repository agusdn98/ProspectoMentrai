class ProspectScorer {
  calculateProspectScore(prospect, criteria) {
    let score = 0;
    const reasons = [];
    const contact = prospect.contact || {};
    const company = prospect.company || {};

    const title = (contact.title || contact.jobTitle || '').toLowerCase();

    if (criteria.jobTitles.length > 0) {
      const exact = criteria.jobTitles.some((t) => title.includes(t.toLowerCase()));
      if (exact) {
        score += 30;
        reasons.push('Exact job title match');
      } else {
        const partial = criteria.jobTitles.some((t) => {
          const keywords = t.toLowerCase().split(' ');
          return keywords.some((kw) => kw && title.includes(kw));
        });
        if (partial) {
          score += 15;
          reasons.push('Partial job title match');
        }
      }
    }

    if (criteria.seniorities.length > 0) {
      const seniority = contact.seniority || contact.seniority_level || null;
      if (seniority && criteria.seniorities.includes(seniority)) {
        score += 20;
        reasons.push('Seniority level match');
      }
    }

    if (criteria.industries.length > 0) {
      const industry = (company.industry || '').toLowerCase();
      const match = criteria.industries.some((ind) => industry.includes(ind.toLowerCase()));
      if (match) {
        score += 15;
        reasons.push('Industry match');
      }
    }

    if (criteria.companySizes.length > 0) {
      const companySize = company.companySize || company.size_range || null;
      if (companySize && criteria.companySizes.includes(companySize)) {
        score += 10;
        reasons.push('Company size match');
      }
    }

    if (criteria.locations.length > 0) {
      const locationParts = [company.city, company.state, company.country].filter(Boolean).join(', ').toLowerCase();
      const match = criteria.locations.some((loc) => locationParts.includes(loc.toLowerCase()));
      if (match) {
        score += 10;
        reasons.push('Location match');
      }
    }

    if (criteria.fundingStages.length > 0) {
      const funding = company.funding_stage || company.fundingStage || null;
      if (funding && criteria.fundingStages.includes(funding)) {
        score += 10;
        reasons.push('Funding stage match');
      }
    }

    if (criteria.technologies.length > 0) {
      const technologies = company.technologies || company.technologiesUsed || [];
      const match = criteria.technologies.some((tech) =>
        technologies.some((companyTech) => companyTech.toLowerCase().includes(tech.toLowerCase()))
      );
      if (match) {
        score += 5;
        reasons.push('Technology stack match');
      }
    }

    return {
      score: Math.min(score, 100),
      reasons
    };
  }
}

module.exports = new ProspectScorer();
