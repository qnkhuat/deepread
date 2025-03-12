/**
 * Provider utility functions for managing and interacting with AI providers
 */

/**
 * Check if a provider is properly configured
 * @param {Object} provider - The provider object
 * @param {string} providerName - The name of the provider
 * @returns {boolean} - Whether the provider is configured
 */
export const isProviderConfigured = (provider, providerName) => {
  if (!provider) return false;
  
  // For OpenAI, Anthropic, and DeepSeek, we need an API key
  if (providerName === 'openai' || providerName === 'anthropic' || providerName === 'deepseek') {
    return provider.api_key && provider.api_key !== '';
  }
  // For Ollama, we need a base_url
  if (providerName === 'ollama') {
    return provider.base_url && provider.base_url !== '';
  }
  // Default case
  return true;
};

/**
 * Check if a provider is enabled
 * @param {Object} provider - The provider object
 * @returns {boolean} - Whether the provider is enabled
 */
export const isProviderEnabled = (provider) => {
  return provider && provider.enabled === true;
};

/**
 * Get the configuration object for API calls
 * @param {Object} provider - The provider object
 * @returns {Object} - Configuration object with api_key and base_url
 */
export const getProviderConfig = (provider) => {
  if (!provider) return {};
  
  return {
    api_key: provider.api_key || '',
    base_url: provider.base_url || ''
  };
};

/**
 * Check if a provider has models available
 * @param {Object} provider - The provider object
 * @returns {boolean} - Whether the provider has models
 */
export const hasModels = (provider) => {
  return provider && Array.isArray(provider.models) && provider.models.length > 0;
};

/**
 * Get available models for a provider
 * @param {Object} provider - The provider object
 * @returns {Array} - Array of model names
 */
export const getModels = (provider) => {
  if (!hasModels(provider)) return [];
  return provider.models;
};

/**
 * Filter models based on a search term
 * @param {Object} provider - The provider object
 * @param {string} searchTerm - The search term
 * @returns {Array} - Filtered array of model names
 */
export const filterModels = (provider, searchTerm) => {
  if (!searchTerm || !hasModels(provider)) return getModels(provider);
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return provider.models.filter(model => 
    model.toLowerCase().includes(lowerSearchTerm)
  );
};

/**
 * Get the default model for a provider
 * @param {Object} provider - The provider object
 * @returns {string|null} - The default model name or null
 */
export const getDefaultModel = (provider) => {
  if (!hasModels(provider)) return null;
  return provider.models[0];
};

/**
 * Check if any provider in the providers object is configured
 * @param {Object} providers - The providers object
 * @returns {boolean} - Whether any provider is configured
 */
export const isAnyProviderConfigured = (providers) => {
  if (!providers) return false;
  
  return Object.entries(providers).some(([name, provider]) => 
    isProviderConfigured(provider, name)
  );
};

/**
 * Check if any provider in the providers object is enabled
 * @param {Object} providers - The providers object
 * @returns {boolean} - Whether any provider is enabled
 */
export const isAnyProviderEnabled = (providers) => {
  if (!providers) return false;
  
  return Object.entries(providers).some(([name, provider]) => 
    isProviderEnabled(provider)
  );
};

/**
 * Find the first available model across all providers
 * @param {Object} providers - The providers object
 * @returns {Array|null} - [providerName, modelName] or null if none found
 */
export const findFirstAvailableModel = (providers) => {
  if (!providers) return null;
  
  for (const [providerName, provider] of Object.entries(providers)) {
    if (isProviderConfigured(provider, providerName) && 
        isProviderEnabled(provider) &&
        hasModels(provider)) {
      return [providerName, provider.models[0]];
    }
  }
  
  return null;
}; 
