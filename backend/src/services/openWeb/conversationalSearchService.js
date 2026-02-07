const axios = require('axios');
const logger = require('../../utils/logger');
const { enrichCompanyData, generateCompanyNames } = require('./openAIEnrichmentService');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search';

/**
 * Use OpenAI to extract search criteria from conversational query
 */
async function interpretSearchQuery(userMessage) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const prompt = `You are a B2B sales search assistant. Extract search criteria from this user message.

User message: "${userMessage}"

Extract and return ONLY a JSON object (no markdown) with:
{
  "industries": ["array of industries/verticals"],
  "roles": ["array of decision maker roles/titles"],
  "companySize": "startup|small|medium|large|enterprise" or null,
  "locations": ["array of countries/regions"],
  "keywords": "any specific keywords or company types",
  "intent": "brief description of what they're looking for"
}

Examples:
- Input: "I need CRM contacts in USA, looking for CTOs at mid-size tech companies"
  Output: {"industries": ["CRM", "Tech"], "roles": ["CTO", "VP of Engineering"], "companySize": "medium", "locations": ["USA"], "keywords": "technology", "intent": "Find CTO contacts at mid-size tech companies"}

- Input: "Give me a list of SaaS founders in Europe"
  Output: {"industries": ["SaaS", "Software"], "roles": ["Founder", "CEO"], "locations": ["Europe"], "keywords": "startup", "intent": "Find founders of SaaS companies in Europe"}

Return ONLY the JSON object, no explanations.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only response assistant. Always respond with valid JSON and nothing else.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 10000
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content?.trim();
    const criteria = JSON.parse(aiResponse);
    logger.info(`Interpreted search: ${JSON.stringify(criteria)}`);
    return criteria;

  } catch (error) {
    logger.error('Query interpretation error:', error.message);
    return null;
  }
}

/**
 * Generate natural language response with search results
 */
async function generateChatResponse(criteria, companies) {
  if (!process.env.OPENAI_API_KEY) {
    return `Found ${companies.length} companies matching your criteria.`;
  }

  try {
    const companiesText = companies.map((c, i) => 
      `${i+1}. ${c.name} (${c.domain}) - ${c.description} - Location: ${c.locationCountry || 'Unknown'}`
    ).join('\n');

    const prompt = `You found these companies matching the user's criteria:

${companiesText}

Create a brief, professional summary (2-3 sentences) of what you found, highlighting the most relevant results. Be conversational but professional.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 8000
      }
    );

    return response.data.choices[0]?.message?.content?.trim();

  } catch (error) {
    logger.error('Chat response generation error:', error.message);
    return `Found ${companies.length} companies matching your criteria.`;
  }
}

// Search for a specific company (reuse from braveSearchService)
async function searchSpecificCompany(companyName, industry) {
  const query = `${companyName} official website ${industry || ''}`;
  
  try {
    const response = await axios.get(BRAVE_API_URL, {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': process.env.BRAVE_API_KEY,
      },
      params: {
        q: query,
        count: 3,
        safesearch: 'moderate',
      },
      timeout: 10000,
    });

    const results = response.data?.web?.results || [];
    
    // Return first result that looks like a real company
    for (const result of results) {
      return result;
    }
    
    return null;
  } catch (error) {
    logger.error(`Error searching for ${companyName}:`, error.message);
    return null;
  }
}

exports.conversationalSearch = async (userMessage, conversationHistory = []) => {
  if (!process.env.BRAVE_API_KEY || !process.env.OPENAI_API_KEY) {
    throw new Error('Missing required API keys');
  }

  try {
    // Step 1: Interpret user's natural language query
    logger.info(`Processing user message: ${userMessage}`);
    const criteria = await interpretSearchQuery(userMessage);
    
    if (!criteria) {
      return {
        message: "I couldn't understand what you're looking for. Could you be more specific about the industry, role, or location?",
        companies: [],
        criteria: null,
        conversationHistory: [...conversationHistory, { role: 'user', content: userMessage }]
      };
    }

    // Step 2: Generate company names based on criteria
    logger.info('Generating company list from criteria...');
    const companyNames = await generateCompanyNames(criteria, 10);
    
    if (!companyNames || companyNames.length === 0) {
      return {
        message: "I couldn't find any companies matching those criteria. Try a different combination of industry, location, or role.",
        companies: [],
        criteria,
        conversationHistory: [...conversationHistory, { role: 'user', content: userMessage }]
      };
    }

    // Step 3: Search for each company
    logger.info(`Searching for ${companyNames.length} companies...`);
    const searchPromises = companyNames.map(name => 
      searchSpecificCompany(name, criteria.industries?.[0])
    );
    const searchResults = await Promise.all(searchPromises);
    
    const validResults = searchResults.filter(r => r !== null);
    logger.info(`Found ${validResults.length} company websites`);

    // Step 4: Process into structured company data
    let companies = validResults.map((result, index) => {
      const domain = result.url?.match(/https?:\/\/(?:www\.)?([^\/]+)/)?.[1] || 'unknown';
      
      return {
        source: 'open-web',
        name: result.title?.split('|')[0]?.split('-')[0]?.trim() || domain,
        domain: domain,
        websiteUrl: result.url,
        description: result.description || '',
        industrySearch: criteria.industries?.[0] || null,
        locationCountry: criteria.locations?.[0] || null,
        rolesMatched: criteria.roles || [],
      };
    });

    // Step 5: Enrich with AI
    if (process.env.OPENAI_API_KEY) {
      logger.info('Enriching company data with AI...');
      companies = await Promise.all(
        companies.map(async (company) => {
          try {
            const enriched = await enrichCompanyData(company);
            return enriched || company;
          } catch (error) {
            return company;
          }
        })
      );
      companies = companies.filter(c => c !== null);
    }

    // Step 6: Generate natural language response
    const chatResponse = await generateChatResponse(criteria, companies);

    return {
      message: chatResponse,
      companies: companies.slice(0, 10), // Return top 10
      criteria,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: chatResponse }
      ]
    };

  } catch (error) {
    logger.error('Conversational search error:', error.message);
    throw error;
  }
};

exports.interpretSearchQuery = interpretSearchQuery;
exports.generateChatResponse = generateChatResponse;
