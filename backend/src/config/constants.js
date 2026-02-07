// Application Constants

// User Roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

// Team Plans
const TEAM_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
};

// Plan Limits
const PLAN_LIMITS = {
  free: {
    maxCompanies: 100,
    maxContacts: 500,
    maxApiCalls: 1000,
    maxCampaigns: 2,
  },
  pro: {
    maxCompanies: 1000,
    maxContacts: 5000,
    maxApiCalls: 10000,
    maxCampaigns: 10,
  },
  enterprise: {
    maxCompanies: Infinity,
    maxContacts: Infinity,
    maxApiCalls: Infinity,
    maxCampaigns: Infinity,
  },
};

// Enrichment Status
const ENRICHMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// Campaign Status
const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

// Contact Seniorities (Apollo.io compatible)
const SENIORITIES = [
  'individual_contributor',
  'manager',
  'senior',
  'director',
  'vp',
  'c_suite',
  'owner',
];

// Company Sizes (Apollo.io compatible)
const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10000+',
];

// Target Industries for Scoring
const TARGET_INDUSTRIES = [
  'SaaS',
  'Technology',
  'Software',
  'E-commerce',
  'Professional Services',
  'FinTech',
  'EdTech',
  'HealthTech',
  'Marketing',
  'Sales',
];

// Target Departments
const TARGET_DEPARTMENTS = [
  'Sales',
  'HR',
  'Human Resources',
  'Operations',
  'Customer Success',
  'Talent',
  'Recruiting',
  'Marketing',
];

// Activity Types
const ACTIVITY_TYPES = {
  EMAIL_SENT: 'email_sent',
  EMAIL_OPENED: 'email_opened',
  EMAIL_CLICKED: 'email_clicked',
  EMAIL_REPLIED: 'email_replied',
  MEETING_BOOKED: 'meeting_booked',
  NOTE_ADDED: 'note_added',
  ENRICHMENT_COMPLETED: 'enrichment_completed',
  CONTACT_ADDED: 'contact_added',
  COMPANY_ADDED: 'company_added',
};

// API Providers
const API_PROVIDERS = {
  APOLLO: 'apollo',
  HUNTER: 'hunter',
  CLEARBIT: 'clearbit',
};

module.exports = {
  USER_ROLES,
  TEAM_PLANS,
  PLAN_LIMITS,
  ENRICHMENT_STATUS,
  CAMPAIGN_STATUS,
  SENIORITIES,
  COMPANY_SIZES,
  TARGET_INDUSTRIES,
  TARGET_DEPARTMENTS,
  ACTIVITY_TYPES,
  API_PROVIDERS,
};
