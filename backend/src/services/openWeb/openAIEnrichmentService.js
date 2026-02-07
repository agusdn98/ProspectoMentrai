const axios = require('axios');
const logger = require('../../utils/logger');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Use OpenAI to enrich company data from search results
 */
async function enrichCompanyData(companyInfo) {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OpenAI API key not configured, skipping enrichment');
    return companyInfo;
  }

  try {
    const prompt = `You are a B2B prospecting assistant. Based on this company information, extract and structure the data:

Company Name: ${companyInfo.name}
Domain: ${companyInfo.domain}
Description: ${companyInfo.description}
Industry: ${companyInfo.industry || 'Unknown'}

Please provide a JSON response with:
1. cleanName: A clean, professional company name (remove generic words like "Home", "Official Site", etc.)
2. shortDescription: A concise 1-2 sentence description of what the company does
3. estimatedSize: Best guess at company size (startup, small, medium, large, enterprise)
4. likelyContacts: Array of likely contact email patterns (e.g., ["info@domain.com", "sales@domain.com"])
5. isRealCompany: true/false - is this actually a company or just an article/definition?

Respond ONLY with valid JSON, no markdown or explanations.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts and structures company information. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 10000
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content;
    if (!aiResponse) {
      return companyInfo;
    }

    // Parse AI response
    const enrichedData = JSON.parse(aiResponse);

    // If AI says it's not a real company, return null to filter it out
    if (enrichedData.isRealCompany === false) {
      logger.info(`AI filtered out non-company: ${companyInfo.name}`);
      return null;
    }

    // Merge enriched data with original
    return {
      ...companyInfo,
      name: enrichedData.cleanName || companyInfo.name,
      description: enrichedData.shortDescription || companyInfo.description,
      estimatedSize: enrichedData.estimatedSize,
      aiEnriched: true,
      suggestedContactEmails: enrichedData.likelyContacts || []
    };

  } catch (error) {
    logger.error('OpenAI enrichment error:', error.message);
    // Return original data if enrichment fails
    return companyInfo;
  }
}

/**
 * Generate a list of real company names using AI, then we'll search for each one
 */
async function generateCompanyNames(filters, count = 30) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const prompt = `You are a B2B sales intelligence assistant. Generate a list of ${count} REAL company names that match these criteria:

Industry: ${filters.industries?.join(', ') || 'Any'}
Location: ${filters.locations?.join(', ') || 'Any'}
Business Type: ${filters.businessType || 'Any'}
Company Size: ${filters.employeeCount || 'Any'} employees

IMPORTANT:
1. Only list ACTUAL companies that exist (not directories, blogs, or review sites)
2. Focus on B2B companies that would be good sales prospects
3. Include a mix of well-known and lesser-known companies
4. DO NOT include: G2, Capterra, BuiltIn, TechCrunch, Forbes, directories, review sites
5. Prioritize companies that match ALL the criteria

Respond with ONLY a JSON array of company names, nothing else. Example format:
["Salesforce", "HubSpot", "Zoho", ...]

Just the JSON array, no markdown, no explanations.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a B2B sales intelligence assistant. You only respond with valid JSON arrays of company names.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 15000
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content?.trim();
    logger.info(`AI response: ${aiResponse}`);
    
    // Parse the JSON array
    const companyNames = JSON.parse(aiResponse);
    logger.info(`AI generated ${companyNames.length} company names`);
    return companyNames;

  } catch (error) {
    logger.error('AI company name generation error:', error.message);
    return null;
  }
}

module.exports = {
  enrichCompanyData,
  generateCompanyNames
};
