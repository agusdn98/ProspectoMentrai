const axios = require('axios');
const rateLimit = require('axios-rate-limit');
const logger = require('../../utils/logger');
const { ExternalAPIError } = require('../../middleware/errorHandler');

// Cliente con rate limiting automático
const apolloClient = rateLimit(
  axios.create({
    baseURL: process.env.APOLLO_BASE_URL || 'https://api.apollo.io/api/v1',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    timeout: 30000, // 30 seconds
  }),
  { 
    maxRequests: parseInt(process.env.APOLLO_RATE_LIMIT_PER_MINUTE) || 120,
    perMilliseconds: 60000 // por minuto
  }
);

// Interceptor para agregar API key a todas las requests
apolloClient.interceptors.request.use(
  (config) => {
    config.headers['X-Api-Key'] = process.env.APOLLO_API_KEY;
    
    logger.info('Apollo API Request:', {
      method: config.method,
      url: config.url,
      params: config.params,
    });
    
    return config;
  },
  (error) => {
    logger.error('Apollo API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apolloClient.interceptors.response.use(
  (response) => {
    logger.info('Apollo API Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error('Apollo API Error:', {
        status: error.response.status,
        data: error.response.data,
        endpoint: error.config.url
      });

      // Rate limit exceeded
      if (error.response.status === 429) {
        throw new ExternalAPIError('Apollo', 'Rate limit exceeded. Please try again later.');
      }

      // Unauthorized
      if (error.response.status === 401) {
        throw new ExternalAPIError('Apollo', 'Invalid API key. Please check your credentials.');
      }

      // Bad request
      if (error.response.status === 400) {
        throw new ExternalAPIError(
          'Apollo', 
          error.response.data.message || 'Bad request'
        );
      }

      // Server error
      if (error.response.status >= 500) {
        throw new ExternalAPIError('Apollo', 'Service temporarily unavailable');
      }
    }

    // Network error
    if (error.code === 'ECONNABORTED') {
      throw new ExternalAPIError('Apollo', 'Request timeout');
    }

    throw error;
  }
);

module.exports = apolloClient;
