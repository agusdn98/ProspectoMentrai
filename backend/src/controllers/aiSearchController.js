const claudeClient = require('../services/ai/claudeClient');
const queryInterpreter = require('../services/ai/queryInterpreter');
const { formatResponse } = require('../services/ai/responseFormatter');
const prisma = require('../config/database');
const logger = require('../utils/logger');

exports.search = async (req, res, next) => {
  try {
    const { query } = req.body;
    const userId = req.user?.userId;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    // Validate API keys
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.error('ANTHROPIC_API_KEY not configured');
      return res.status(503).json({
        success: false,
        error: 'AI service is not configured. Please contact support.'
      });
    }

    logger.info('AI search request', { userId, query });

    // Interpret the query with Claude AI
    const criteria = await queryInterpreter.interpret(query);
    const summary = queryInterpreter.summarizeCriteria(criteria);

    // Generate prospect recommendations using Claude AI
    const prospects = await claudeClient.generateProspects(query, criteria);

    if (userId) {
      await prisma.savedSearch.create({
        data: {
          searchName: query.substring(0, 100),
          searchCriteria: criteria,
          createdBy: userId
        }
      }).catch((err) => logger.warn('SavedSearch create failed', { error: err.message }));
    }

    const result = {
      query,
      criteria,
      totalFound: prospects.length,
      prospects
    };

    return res.json(formatResponse(result, summary));
  } catch (error) {
    logger.error('AI search error:', { error: error.message, stack: error.stack });
    next(error);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    const recentSearches = userId
      ? await prisma.savedSearch.findMany({
          where: { createdBy: userId },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      : [];

    const previousQueries = recentSearches.map((search) => search.searchName);

    const suggestions = await claudeClient.generateSearchSuggestions({
      previousSearches: previousQueries
    });

    res.json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};

exports.saveProspects = async (req, res, next) => {
  try {
    const { prospects = [], listId, listName } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!Array.isArray(prospects) || prospects.length === 0) {
      return res.status(400).json({ success: false, error: 'Prospects are required' });
    }

    let list = null;

    if (listId) {
      list = await prisma.list.findUnique({ where: { id: listId } });
    } else if (listName) {
      list = await prisma.list.create({
        data: {
          listName,
          createdBy: userId,
          listType: 'ai_generated'
        }
      });
    }

    if (!list) {
      return res.status(400).json({ success: false, error: 'List not found or not created' });
    }

    let savedCount = 0;

    for (const prospect of prospects) {
      const companyDomain = prospect.companyDomain || prospect.company?.primary_domain || prospect.company?.domain;
      const companyName = prospect.companyName || prospect.company?.name || companyDomain;

      if (!companyDomain) {
        continue;
      }

      const company = await prisma.company.upsert({
        where: { domain: companyDomain },
        update: {
          companyName: companyName || companyDomain,
          industry: prospect.companyIndustry || null,
          companySize: prospect.companySize || null,
          locationCountry: prospect.companyCountry || prospect.company?.country || null,
          locationCity: prospect.companyCity || prospect.company?.city || null,
          websiteUrl: prospect.companyWebsite || null,
          linkedinUrl: prospect.companyLinkedIn || null
        },
        create: {
          domain: companyDomain,
          companyName: companyName || companyDomain,
          industry: prospect.companyIndustry || null,
          companySize: prospect.companySize || null,
          locationCountry: prospect.companyCountry || prospect.company?.country || null,
          locationCity: prospect.companyCity || prospect.company?.city || null,
          websiteUrl: prospect.companyWebsite || null,
          linkedinUrl: prospect.companyLinkedIn || null,
          enrichmentStatus: 'pending'
        }
      });

      await prisma.listCompany.upsert({
        where: {
          listId_companyId: {
            listId: list.id,
            companyId: company.id
          }
        },
        update: {},
        create: {
          listId: list.id,
          companyId: company.id
        }
      });

      const contactFirstName = prospect.contactFirstName || prospect.contact?.first_name || null;
      const contactLastName = prospect.contactLastName || prospect.contact?.last_name || null;

      if (contactFirstName && contactLastName) {
        const contactEmail = prospect.contactEmail || prospect.contact?.email || null;
        const existingContact = await prisma.contact.findFirst({
          where: {
            companyId: company.id,
            OR: [
              contactEmail ? { email: contactEmail } : undefined,
              { fullName: `${contactFirstName} ${contactLastName}` }
            ].filter(Boolean)
          }
        });

        const contact = existingContact || await prisma.contact.create({
          data: {
            companyId: company.id,
            firstName: contactFirstName,
            lastName: contactLastName,
            fullName: `${contactFirstName} ${contactLastName}`,
            jobTitle: prospect.contactTitle || null,
            seniority: prospect.contactSeniority || null,
            email: contactEmail,
            emailVerified: Boolean(prospect.contactEmailVerified),
            phone: prospect.contactPhone || null,
            linkedinUrl: prospect.contactLinkedIn || null
          }
        });

        await prisma.listContact.upsert({
          where: {
            listId_contactId: {
              listId: list.id,
              contactId: contact.id
            }
          },
          update: {},
          create: {
            listId: list.id,
            contactId: contact.id
          }
        });
      }

      savedCount += 1;
    }

    return res.json({
      success: true,
      listId: list.id,
      listName: list.listName,
      savedCount
    });
  } catch (error) {
    next(error);
  }
};
