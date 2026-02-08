let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (error) {
  console.error('Failed to load @anthropic-ai/sdk. Please run: npm install @anthropic-ai/sdk');
  Anthropic = null;
}

class ClaudeClient {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

    if (!Anthropic) {
      console.error('@anthropic-ai/sdk package not available');
      this.client = null;
      return;
    }

    if (this.apiKey) {
      try {
        this.client = new Anthropic({
          apiKey: this.apiKey
        });
      } catch (error) {
        console.error('Failed to initialize Anthropic client:', error);
        this.client = null;
      }
    } else {
      console.warn('ANTHROPIC_API_KEY not configured');
      this.client = null;
    }
  }

  ensureApiKey() {
    if (!this.apiKey || !this.client) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please add it in Render dashboard.');
    }
  }

  async sendMessage(systemPrompt, userMessage, options = {}) {
    this.ensureApiKey();

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      });

      return response.content[0].text || '';
    } catch (error) {
      const details = error.message || error;
      throw new Error(`Failed to get AI interpretation: ${JSON.stringify(details)}`);
    }
  }

  async interpretProspectQuery(userQuery) {
    const systemPrompt = `You are an expert sales intelligence assistant. Your job is to interpret natural language prospect searches and convert them into structured search criteria.

ALWAYS respond with ONLY valid JSON in this exact format:
{
  "industries": ["industry1", "industry2"],
  "jobTitles": ["title1", "title2"],
  "seniorities": ["seniority1", "seniority2"],
  "departments": ["dept1", "dept2"],
  "companySizes": ["size_range1", "size_range2"],
  "locations": ["location1", "location2"],
  "fundingStages": ["stage1", "stage2"],
  "technologies": ["tech1", "tech2"],
  "keywords": ["keyword1", "keyword2"]
}

RULES:
1. Industries: Use standard categories like "SaaS", "Technology", "E-commerce", "FinTech", "Healthcare", "Professional Services", "Manufacturing", "Retail", "Education", "Real Estate"
2. Job Titles: Extract specific titles or patterns. Examples: "VP of Sales", "Director", "Head of HR", "Chief Technology Officer", "Sales Manager", "Talent Acquisition"
3. Seniorities: Map to these values ONLY: "c_suite", "vp", "director", "manager", "senior", "entry"
4. Departments: Use: "Sales", "Marketing", "HR", "Operations", "Engineering", "Customer Success", "Product", "Finance"
5. Company Sizes (employee ranges): Use these EXACT formats: "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"
6. Locations: Extract cities, states, or countries. Examples: "San Francisco, CA", "New York", "California", "United States", "Barcelona, Spain"
7. Funding Stages: Use: "Seed", "Series A", "Series B", "Series C", "Series D", "Growth", "Public", "Acquired"
8. Technologies: Extract mentioned technologies or tech stacks. Examples: "Salesforce", "HubSpot", "AWS", "Python", "React"
9. Keywords: Extract any other important keywords that do not fit above categories

IMPORTANT:
- Be generous with job title variations (include synonyms and variations)
- If company size is mentioned as ">X employees", convert to appropriate ranges
- Support both English and Spanish queries
- Return ONLY the JSON, no explanations or markdown`;

    const responseText = await this.sendMessage(systemPrompt, userQuery);

    try {
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      throw new Error(`AI returned invalid JSON format: ${responseText}`);
    }
  }

  async generateSearchSuggestions(context = {}) {
    const systemPrompt = `You are a sales intelligence assistant. Generate 5 relevant prospect search suggestions based on the context provided. Return ONLY a JSON array of strings.

Example output:
["Find VPs of Sales at SaaS companies in California", "Search for HR Directors at Series B startups", "Identify CTOs at tech companies using AWS"]`;

    const userMessage = `Generate 5 prospect search suggestions${context.industry ? ` for ${context.industry} industry` : ''}${context.previousSearches ? `. Previous searches: ${context.previousSearches.join(', ')}` : ''}`;

    const responseText = await this.sendMessage(systemPrompt, userMessage, { maxTokens: 800 });

    try {
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      return [
        'Find VPs of Sales at SaaS companies',
        'Search for HR Directors at tech startups',
        'Identify CTOs at Series B companies',
        'Find Customer Success leaders in Barcelona',
        'Search for Sales Enablement professionals'
      ];
    }
  }

  async generateProspects(userQuery, criteria) {
    const systemPrompt = `You are an expert B2B prospecting assistant. Based on the user's search query and extracted criteria, generate a list of realistic prospect profiles that match their requirements.

Return ONLY valid JSON in this exact format:
[
  {
    "companyName": "Company Name",
    "companyDomain": "company.com",
    "companyIndustry": "Industry",
    "companySize": "51-200",
    "companyLocation": "City, Country",
    "companyFunding": "Series B",
    "contactFullName": "First Last",
    "contactTitle": "Job Title",
    "contactEmail": "email@company.com",
    "contactLinkedIn": "https://linkedin.com/in/profile",
    "contactPhone": "+1234567890",
    "matchScore": 85,
    "matchReasons": ["Reason 1", "Reason 2"]
  }
]

IMPORTANT:
- Generate 8-15 realistic prospects
- Use real-sounding company names and person names
- Match scores should be between 70-95
- Include 2-4 match reasons per prospect
- Email format: firstname.lastname@domain.com or firstname@domain.com
- Support both English and Spanish queries
- Make it realistic and diverse
- Return ONLY the JSON array, no markdown`;

    const userMessage = `Generate prospects for: "${userQuery}"
    
Criteria extracted:
- Industries: ${criteria.industries?.join(', ') || 'Any'}
- Job Titles: ${criteria.jobTitles?.join(', ') || 'Any'}
- Locations: ${criteria.locations?.join(', ') || 'Any'}
- Company Sizes: ${criteria.companySizes?.join(', ') || 'Any'}
- Departments: ${criteria.departments?.join(', ') || 'Any'}
- Seniorities: ${criteria.seniorities?.join(', ') || 'Any'}`;

    const responseText = await this.sendMessage(systemPrompt, userMessage, { maxTokens: 4000 });

    try {
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Failed to parse prospects JSON:', responseText);
      // Return empty array if parsing fails
      return [];
    }
  }
}

module.exports = new ClaudeClient();
