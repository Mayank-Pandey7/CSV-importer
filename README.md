#  GrowEasy AI-Powered CSV Importer

An AI-powered CSV importer that accepts CSVs of **any column layout** (Facebook Lead Exports, Google Ads Exports, Excel sheets, real estate CRM exports, sales reports, manually created spreadsheets) and intelligently maps them into GrowEasy's fixed CRM schema using an LLM.

---

#  Architecture

```text
Next.js frontend --CSV file--> Express backend --batched rows--> OpenAI
       |                                   |
client-side preview              parse -> batch -> AI extract -> validate
       |                                   |
confirm button                 <--JSON-- return { imported, skipped, totals }
```

- **Frontend**: Next.js (App Router, TypeScript, Tailwind). Handles upload, client-side CSV preview (PapaParse), and rendering AI-extracted results. No AI call happens until the user clicks **Confirm & Import**.

- **Backend**: Node + Express. Parses the CSV, batches rows, sends each batch to the LLM with a strict system prompt + few-shot example, validates the AI's output against the fixed schema (enum whitelisting, date sanity checks), and retries failed batches with backoff.

- **Stateless**: No database is used; nothing is persisted server-side.

---

#  Project Structure

```text
groweasy-csv-importer/
├── backend/
│   ├── src/
│   │   ├── config/config.js          # env config + CRM schema constants
│   │   ├── routes/import.js          # POST /api/import pipeline
│   │   ├── services/
│   │   │   ├── csvParser.js          # raw CSV -> row objects
│   │   │   ├── aiExtractor.js        # LLM prompt + call
│   │   │   └── validator.js          # enforces enums, sanitizes output
│   │   ├── utils/batchHelper.js      # chunking rows into batches
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # step state machine (upload/preview/result)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── UploadStep.tsx            # drag & drop upload
│   │   ├── PreviewStep.tsx           # raw CSV preview table
│   │   └── ResultStep.tsx            # imported/skipped result table
│   ├── lib/types.ts
│   ├── package.json
│   └── .env.example
│
├── sample-data/
│   └── messy_facebook_export.csv     # test file with non-standard columns
│
└── README.md
```

---

#  Setup & Run Locally

## Prerequisites

- Node.js 18+
- An OpenAI API key (or adapt `aiExtractor.js` for Gemini/Claude)

---

##  Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and add your key:

```env
OPENAI_API_KEY=sk-...
```

Run it:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

---

## 2️ Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

---

##  Test It

Upload:

```text
sample-data/messy_facebook_export.csv
```

It has non-standard column names (`Full Name`, `Alt Email`, `Phone Number`, `Lead Status`, etc.) to prove the AI mapping works regardless of layout.

---

#  How the AI Mapping Works

The backend sends each batch of raw rows to the LLM with a system prompt that:

1. Lists the exact 15 GrowEasy CRM fields and their meaning.
2. Restricts `crm_status` and `data_source` to their fixed enum lists (empty string if no confident match — never invented).
3. Explains the multi-email / multi-phone rule (first value used, rest appended to `crm_note`).
4. Requires strict JSON output (`response_format: json_object`), with a worked few-shot example for a messy row.
5. Instructs the model to mark rows with neither email nor phone as skipped.

After the LLM responds, `validator.js` re-checks every field:

- Any `crm_status` / `data_source` value outside the allowed lists is blanked.
- Any unparseable `created_at` is blanked.
- Any record still missing both email and phone is moved to `skipped`.

This ensures the app never trusts the model blindly.

Failed batches are retried up to `MAX_RETRIES` times with exponential backoff.

If a batch still fails, its rows are marked skipped with the error reason rather than failing the whole import.

---

#  Deployment

### Frontend

- Vercel
- Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.

### Backend

- Render / Railway
- Set:
  - `OPENAI_API_KEY`
  - `FRONTEND_ORIGIN` (your Vercel URL)

---

#  Environment Variables

## Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `FRONTEND_ORIGIN` | Allowed CORS origin |
| `AI_PROVIDER` | `openai` (extend for others) |
| `OPENAI_API_KEY` | Your OpenAI key |
| `OPENAI_MODEL` | Model name (default `gpt-4o-mini`) |
| `BATCH_SIZE` | Rows per AI batch (default 20) |
| `MAX_RETRIES` | Retries per failed batch (default 2) |

---

## Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL |

---

#  Notes / Future Improvements

- Add streaming progress via SSE/WebSocket for per-batch updates.
- Add virtualization (`react-window`) for very large CSVs (10k+ rows).
- Add unit tests for `validator.js` and `csvParser.js`.
- Add Docker Compose for one-command local spin-up.

---

# CSV-importer
