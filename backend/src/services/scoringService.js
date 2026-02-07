const { TARGET_INDUSTRIES, TARGET_DEPARTMENTS } = require('../config/constants');

/**
 * Calculate ideal customer score for a company (0-100)
 */
exports.calculateCompanyScore = (company) => {
  let score = 0;

  // Industry match (30 points)
  if (company.industry && TARGET_INDUSTRIES.includes(company.industry)) {
    score += 30;
  } else if (company.industry) {
    // Partial match for related industries
    score += 10;
  }

  // Company size (25 points)
  const idealSizes = ['51-200', '201-500'];
  if (company.companySize && idealSizes.includes(company.companySize)) {
    score += 25;
  } else if (company.companySize && ['11-50', '501-1000'].includes(company.companySize)) {
    score += 15;
  } else if (company.companySize) {
    score += 5;
  }

  // Funding stage (20 points)
  const fundedStages = ['Series A', 'Series B', 'Series C', 'Series D', 'Growth'];
  if (company.fundingStage && fundedStages.includes(company.fundingStage)) {
    score += 20;
  } else if (company.fundingStage === 'Seed') {
    score += 10;
  }

  // Growth signals (15 points)
  if (company.growthSignals && company.growthSignals.length > 0) {
    score += Math.min(company.growthSignals.length * 5, 15);
  }

  // Technologies (10 points)
  const relevantTechs = ['Salesforce', 'HubSpot', 'Intercom', 'Zendesk', 'AWS', 'Slack'];
  if (company.technologiesUsed && company.technologiesUsed.length > 0) {
    const matchingTechs = company.technologiesUsed.filter(tech => 
      relevantTechs.some(rt => tech.toLowerCase().includes(rt.toLowerCase()))
    );
    score += Math.min(matchingTechs.length * 3, 10);
  }

  return Math.min(Math.round(score), 100);
};

/**
 * Calculate relevance score for a contact (0-100)
 */
exports.calculateContactRelevance = (contact, company) => {
  let score = 0;

  // Seniority (40 points)
  const seniorityScores = {
    'c_suite': 40,
    'vp': 35,
    'director': 30,
    'senior': 20,
    'manager': 15,
    'individual_contributor': 5
  };
  
  const normalizedSeniority = contact.seniority?.toLowerCase().replace(' ', '_');
  score += seniorityScores[normalizedSeniority] || 0;

  // Department relevance (30 points)
  if (contact.department && TARGET_DEPARTMENTS.includes(contact.department)) {
    score += 30;
  } else if (contact.department) {
    score += 10;
  }

  // Job title keywords (20 points)
  const titleKeywords = [
    'head of', 'chief', 'vp', 'vice president', 'director', 
    'sales enablement', 'talent', 'recruiting', 'people ops',
    'revenue', 'growth'
  ];
  
  if (contact.jobTitle) {
    const lowerTitle = contact.jobTitle.toLowerCase();
    const titleMatch = titleKeywords.some(keyword => lowerTitle.includes(keyword));
    if (titleMatch) {
      score += 20;
    }
  }

  // Email verified (10 points)
  if (contact.emailVerified || contact.email_status === 'verified') {
    score += 10;
  }

  return Math.min(Math.round(score), 100);
};

/**
 * Determine if contact is relevant for outreach
 */
exports.isRelevantForOutreach = (contact) => {
  const targetSeniorities = ['c_suite', 'vp', 'director', 'senior'];
  const normalizedSeniority = contact.seniority?.toLowerCase().replace(' ', '_');
  
  const hasSeniority = targetSeniorities.includes(normalizedSeniority);
  const hasDepartment = contact.department && TARGET_DEPARTMENTS.includes(contact.department);
  
  const titleKeywords = [
    'head of', 'chief', 'vp', 'vice president', 'director',
    'sales enablement', 'talent', 'recruiting'
  ];
  
  const hasRelevantTitle = contact.jobTitle && 
    titleKeywords.some(keyword => 
      contact.jobTitle.toLowerCase().includes(keyword)
    );

  // Must have either (seniority AND department) OR relevant title
  return (hasSeniority && hasDepartment) || hasRelevantTitle;
};

/**
 * Recommend similar companies based on profile
 */
exports.findSimilarCompanies = async (companyId) => {
  const prisma = require('../config/database');
  
  const targetCompany = await prisma.company.findUnique({ 
    where: { id: companyId } 
  });

  if (!targetCompany) {
    return [];
  }

  // Find companies with similar attributes
  const similarCompanies = await prisma.company.findMany({
    where: {
      id: { not: companyId },
      industry: targetCompany.industry,
      companySize: targetCompany.companySize,
      idealCustomerScore: {
        gte: Math.max(targetCompany.idealCustomerScore - 20, 0),
        lte: Math.min(targetCompany.idealCustomerScore + 20, 100)
      }
    },
    take: 10,
    orderBy: {
      idealCustomerScore: 'desc'
    }
  });

  return similarCompanies;
};

module.exports = exports;
