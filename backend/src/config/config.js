require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',

  aiProvider: process.env.AI_PROVIDER || 'openai',
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },

  batchSize: parseInt(process.env.BATCH_SIZE, 10) || 20,
  maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 2,

  // Fixed CRM schema constraints (from assignment spec)
  ALLOWED_CRM_STATUS: [
    'GOOD_LEAD_FOLLOW_UP',
    'DID_NOT_CONNECT',
    'BAD_LEAD',
    'SALE_DONE',
  ],
  ALLOWED_DATA_SOURCE: [
    'leads_on_demand',
    'meridian_tower',
    'eden_park',
    'varah_swamy',
    'sarjapur_plots',
  ],
  CRM_FIELDS: [
    'created_at',
    'name',
    'email',
    'country_code',
    'mobile_without_country_code',
    'company',
    'city',
    'state',
    'country',
    'lead_owner',
    'crm_status',
    'crm_note',
    'data_source',
    'possession_time',
    'description',
  ],
};
