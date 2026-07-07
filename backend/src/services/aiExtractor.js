const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');

const openai = config.openai.apiKey
  ? new OpenAI({ apiKey: config.openai.apiKey })
  : null;

const gemini = config.gemini.apiKey
  ? new GoogleGenerativeAI(config.gemini.apiKey)
  : null;

/**
 * System prompt: defines the exact CRM schema, allowed enum values,
 * and every extraction rule from the assignment spec. Kept strict and
 * explicit so the model has minimal room for ambiguity across wildly
 * different CSV layouts (Facebook exports, Google Ads exports, manual
 * sheets, etc).
 */
const SYSTEM_PROMPT = `You are a data-mapping engine for GrowEasy CRM.

You will receive an array of raw CSV row objects. Each row may come from a
different source (Facebook Lead Export, Google Ads Export, Excel sheet, real
estate CRM export, sales report, marketing agency CSV, or a manually created
spreadsheet), so column names, casing, language, and structure will vary
wildly and are NOT fixed. Your job is to intelligently map each row's
available fields into the following fixed GrowEasy CRM schema.

CRM FIELDS (output keys, use exactly these names):
- created_at: lead creation date/time. Must be a string parseable by
  JavaScript's "new Date(created_at)". Prefer "YYYY-MM-DD HH:mm:ss" format.
  If no date is present in the row, leave it as an empty string.
- name: the lead's full name.
- email: the primary email address (see multi-email rule below).
- country_code: phone country code, e.g. "+91". Infer from context/format
  when possible; default to "+91" only if the data clearly implies an
  Indian number and no code is given. Otherwise leave blank.
- mobile_without_country_code: phone number WITHOUT the country code.
- company: company or organization name.
- city: city name.
- state: state/province name.
- country: country name.
- lead_owner: the person/agent who owns this lead (often an email).
- crm_status: MUST be exactly one of these four values, or an empty string:
  ["GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE"]
  Map free-text status fields to the closest matching value. If nothing
  matches confidently, leave it blank. NEVER invent a value outside this list.
- crm_note: free-text notes. Use this field for: remarks, follow-up notes,
  additional comments, EXTRA phone numbers beyond the first, EXTRA email
  addresses beyond the first, and any other useful info that doesn't fit
  another field.
- data_source: MUST be exactly one of these five values, or an empty string:
  ["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"]
  Only set this if the row confidently indicates one of these sources.
  Otherwise leave it blank. NEVER invent a value outside this list.
- possession_time: property possession time/date, if applicable (real estate
  leads). Otherwise leave blank.
- description: any additional descriptive text that doesn't belong elsewhere.

RULES:
1. Multiple emails in one row: use the FIRST as "email", append the rest into
   "crm_note" (e.g. "Additional email: x@y.com").
2. Multiple phone numbers in one row: use the FIRST as
   "mobile_without_country_code", append the rest into "crm_note".
3. Each output record corresponds to exactly one input row. Do not merge or
   split rows.
4. Do not introduce raw line breaks inside any field value. If a note needs
   a line break, use the literal characters "\\n".
5. If a row has NEITHER an email NOR a mobile number, mark it as skipped
   (see output format below) instead of returning a record for it.
6. Never fabricate data that is not present or reasonably inferable from the
   row. Leave a field as an empty string "" if unknown.
7. Trim whitespace from all values.

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown fences, no
preamble, no explanation. The JSON must have this exact shape:

{
  "imported": [ { <CRM field object> }, ... ],
  "skipped": [ { "row": <original row object>, "reason": "<short reason>" }, ... ]
}`;

/**
 * Few-shot example to anchor the model's behavior on ambiguous/messy input.
 */
const FEW_SHOT_USER = JSON.stringify([
  {
    'Date': '13/05/2026 2:20 PM',
    'Full Name': 'John Doe',
    'Email 1': 'john.doe@example.com',
    'Email 2': 'j.doe.alt@example.com',
    'Phone': '+91 9876543210, 9123456780',
    'City': 'Mumbai',
    'Status': 'Follow up requested',
    'Remarks': 'Wants a demo reschedule',
  },
  {
    'Name': 'No Contact Row',
    'Notes': 'Walked in, left no details',
  },
]);

const FEW_SHOT_ASSISTANT = JSON.stringify({
  imported: [
    {
      created_at: '2026-05-13 14:20:00',
      name: 'John Doe',
      email: 'john.doe@example.com',
      country_code: '+91',
      mobile_without_country_code: '9876543210',
      company: '',
      city: 'Mumbai',
      state: '',
      country: '',
      lead_owner: '',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      crm_note:
        'Wants a demo reschedule. Additional email: j.doe.alt@example.com. Additional phone: 9123456780',
      data_source: '',
      possession_time: '',
      description: '',
    },
  ],
  skipped: [
    {
      row: { Name: 'No Contact Row', Notes: 'Walked in, left no details' },
      reason: 'No email or mobile number present',
    },
  ],
});

/**
 * Calls the configured LLM for a single batch of raw CSV rows and returns
 * the parsed { imported, skipped } result. Throws on malformed JSON so the
 * caller can retry.
 */
async function extractBatch(rows) {
  if (config.aiProvider === 'openai') {
    return extractWithOpenAI(rows);
  }
  if (config.aiProvider === 'gemini') {
    return extractWithGemini(rows);
  }
  throw new Error(
    `AI provider "${config.aiProvider}" not implemented. Use openai or gemini, or add your own provider in aiExtractor.js.`
  );
}

async function extractWithGemini(rows) {
  if (!gemini) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your .env file (see .env.example).'
    );
  }

  const model = gemini.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent([
    { text: `Example input:\n${FEW_SHOT_USER}` },
    { text: `Example output:\n${FEW_SHOT_ASSISTANT}` },
    { text: `Now process this input the same way:\n${JSON.stringify(rows)}` },
  ]);

  const raw = result.response.text();
  if (!raw) {
    throw new Error('Empty response from AI model.');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`AI returned invalid JSON: ${err.message}`);
  }

  if (!Array.isArray(parsed.imported) || !Array.isArray(parsed.skipped)) {
    throw new Error('AI response missing "imported"/"skipped" arrays.');
  }

  return parsed;
}

async function extractWithOpenAI(rows) {
  if (!openai) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to your .env file (see .env.example).'
    );
  }

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: FEW_SHOT_USER },
      { role: 'assistant', content: FEW_SHOT_ASSISTANT },
      { role: 'user', content: JSON.stringify(rows) },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Empty response from AI model.');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`AI returned invalid JSON: ${err.message}`);
  }

  if (!Array.isArray(parsed.imported) || !Array.isArray(parsed.skipped)) {
    throw new Error('AI response missing "imported"/"skipped" arrays.');
  }

  return parsed;
}

module.exports = { extractBatch };
