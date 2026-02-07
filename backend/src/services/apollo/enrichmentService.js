const organizationService = require('./organizationService');
const peopleService = require('./peopleService');
const scoringService = require('../scoringService');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');
const { ENRICHMENT_STATUS, ACTIVITY_TYPES } = require('../../config/constants');

/**
 * Workflow completo: Enriquecer empresa y sus contactos
 */
exports.enrichCompanyComplete = async (companyId, userId) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });

    if (!company) {
      throw new Error('Company not found');
    }

    logger.info(`Starting enrichment for company: ${company.companyName}`);

    // 1. Actualizar estado
    await prisma.company.update({
      where: { id: companyId },
      data: { enrichmentStatus: ENRICHMENT_STATUS.PROCESSING }
    });

    // 2. Enriquecer datos de la empresa (CONSUME CRÉDITOS)
    const enrichedOrg = await organizationService.enrichOrganization(company.domain);

    if (!enrichedOrg) {
      await prisma.company.update({
        where: { id: companyId },
        data: { enrichmentStatus: ENRICHMENT_STATUS.FAILED }
      });
      throw new Error('Failed to enrich company data');
    }

    // 3. Calcular score de MENTRAI
    const idealCustomerScore = scoringService.calculateCompanyScore(enrichedOrg);

    // 4. Actualizar empresa en BD
    await prisma.company.update({
      where: { id: companyId },
      data: {
        companyName: enrichedOrg.name,
        websiteUrl: enrichedOrg.websiteUrl,
        linkedinUrl: enrichedOrg.linkedinUrl,
        industry: enrichedOrg.industry,
        subIndustry: enrichedOrg.subIndustry,
        companySize: enrichedOrg.companySize,
        employeeCount: enrichedOrg.employeeCount,
        foundedYear: enrichedOrg.foundedYear,
        description: enrichedOrg.description,
        fundingStage: enrichedOrg.fundingStage,
        totalFunding: enrichedOrg.totalFunding,
        latestFundingRound: enrichedOrg.latestFundingRound,
        latestFundingAmount: enrichedOrg.latestFundingAmount,
        locationCity: enrichedOrg.locationCity,
        locationState: enrichedOrg.locationState,
        locationCountry: enrichedOrg.locationCountry,
        technologiesUsed: enrichedOrg.technologiesUsed,
        phone: enrichedOrg.phone,
        logoUrl: enrichedOrg.logoUrl,
        growthSignals: enrichedOrg.growthSignals,
        apolloId: enrichedOrg.apolloId,
        idealCustomerScore,
        enrichmentStatus: ENRICHMENT_STATUS.COMPLETED,
        enrichedAt: new Date()
      }
    });

    // 5. Buscar contactos relevantes (NO CONSUME CRÉDITOS)
    const peopleResults = await peopleService.getContactsByCompany(company.domain, {
      perPage: 50
    });

    logger.info(`Found ${peopleResults.length} contacts for ${company.companyName}`);

    // 6. Guardar contactos básicos (sin emails todavía)
    const contacts = [];
    for (const person of peopleResults) {
      // Verificar si el contacto ya existe
      const existingContact = await prisma.contact.findFirst({
        where: {
          companyId: companyId,
          apolloId: person.id
        }
      });

      if (existingContact) {
        continue; // Skip if already exists
      }

      // Calcular relevancia
      const relevanceScore = scoringService.calculateContactRelevance(person, enrichedOrg);
      const relevantForOutreach = scoringService.isRelevantForOutreach(person);

      const contact = await prisma.contact.create({
        data: {
          companyId: companyId,
          firstName: person.first_name,
          lastName: person.last_name,
          fullName: person.name,
          jobTitle: person.title,
          department: person.departments?.[0],
          seniority: person.seniority,
          linkedinUrl: person.linkedin_url,
          location: formatLocation(person),
          city: person.city,
          state: person.state,
          country: person.country,
          photoUrl: person.photo_url,
          relevantForOutreach,
          relevanceScore,
          enrichmentStatus: ENRICHMENT_STATUS.PENDING, // Enriquecer emails después
          apolloId: person.id
        }
      });

      contacts.push(contact);
    }

    // 7. Crear actividad
    if (userId) {
      await prisma.activity.create({
        data: {
          companyId: companyId,
          activityType: ACTIVITY_TYPES.ENRICHMENT_COMPLETED,
          activityDetails: {
            contactsFound: contacts.length,
            relevantContacts: contacts.filter(c => c.relevantForOutreach).length
          },
          performedBy: userId
        }
      });
    }

    logger.info(`Enrichment completed for ${company.companyName}: ${contacts.length} contacts saved`);

    return {
      company: enrichedOrg,
      contacts: contacts,
      totalContacts: contacts.length,
      relevantContacts: contacts.filter(c => c.relevantForOutreach).length
    };

  } catch (error) {
    logger.error('Error in enrichCompanyComplete:', error);
    
    // Marcar como fallido
    await prisma.company.update({
      where: { id: companyId },
      data: { enrichmentStatus: ENRICHMENT_STATUS.FAILED }
    });

    throw error;
  }
};

/**
 * Enriquecer email de un contacto específico
 * Usar cuando realmente necesites el email (ej: antes de campaña)
 */
exports.enrichContactEmail = async (contactId, userId) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: { company: true }
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    logger.info(`Enriching contact email: ${contact.fullName}`);

    // Enriquecer con Apollo (CONSUME CRÉDITOS)
    const enrichedPerson = await peopleService.enrichPerson({
      firstName: contact.firstName,
      lastName: contact.lastName,
      companyName: contact.company.companyName,
      companyDomain: contact.company.domain,
      apolloId: contact.apolloId
    });

    if (!enrichedPerson) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { enrichmentStatus: ENRICHMENT_STATUS.FAILED }
      });
      return null;
    }

    // Actualizar contacto con email y teléfono
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        email: enrichedPerson.email,
        emailStatus: enrichedPerson.emailStatus,
        emailVerified: enrichedPerson.emailStatus === 'verified',
        personalEmails: enrichedPerson.personalEmails,
        phone: enrichedPerson.phone,
        phoneNumbers: enrichedPerson.phoneNumbers,
        twitterUrl: enrichedPerson.twitterUrl,
        facebookUrl: enrichedPerson.facebookUrl,
        enrichmentStatus: ENRICHMENT_STATUS.COMPLETED,
        updatedAt: new Date()
      }
    });

    // Crear actividad
    if (userId) {
      await prisma.activity.create({
        data: {
          contactId: contactId,
          activityType: ACTIVITY_TYPES.ENRICHMENT_COMPLETED,
          activityDetails: {
            emailFound: !!enrichedPerson.email,
            emailStatus: enrichedPerson.emailStatus,
            phoneFound: !!enrichedPerson.phone
          },
          performedBy: userId
        }
      });
    }

    logger.info(`Contact enriched: ${contact.fullName} - Email: ${enrichedPerson.email || 'Not found'}`);

    return updatedContact;

  } catch (error) {
    logger.error('Error enriching contact email:', error);
    throw error;
  }
};

/**
 * Enriquecer emails en bulk para una lista de contactos
 * Usa el endpoint bulk de Apollo (más eficiente)
 */
exports.bulkEnrichContactEmails = async (contactIds, userId) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      include: { company: true }
    });

    logger.info(`Bulk enriching ${contacts.length} contacts`);

    // Apollo bulk enrichment acepta hasta 10 personas por request
    const BATCH_SIZE = 10;
    const enrichedContacts = [];

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);
      
      const peopleData = batch.map(c => ({
        firstName: c.firstName,
        lastName: c.lastName,
        companyName: c.company.companyName,
        companyDomain: c.company.domain
      }));

      const enrichedBatch = await peopleService.bulkEnrichPeople(peopleData);

      // Actualizar contactos en BD
      for (let j = 0; j < batch.length; j++) {
        const contact = batch[j];
        const enriched = enrichedBatch[j];

        if (enriched && enriched.person) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              email: enriched.person.email,
              emailVerified: enriched.person.email_status === 'verified',
              phone: enriched.person.phone_numbers?.[0]?.sanitized_number,
              enrichmentStatus: ENRICHMENT_STATUS.COMPLETED
            }
          });

          enrichedContacts.push(contact.id);
        }
      }
    }

    logger.info(`Bulk enrichment completed: ${enrichedContacts.length}/${contacts.length} contacts enriched`);

    return {
      totalProcessed: contactIds.length,
      totalEnriched: enrichedContacts.length,
      enrichedContactIds: enrichedContacts
    };

  } catch (error) {
    logger.error('Error bulk enriching contacts:', error);
    throw error;
  }
};

function formatLocation(person) {
  const parts = [person.city, person.state, person.country].filter(Boolean);
  return parts.join(', ') || null;
}

module.exports = exports;
