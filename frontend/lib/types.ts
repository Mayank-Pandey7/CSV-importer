export type RawCSVRow = Record<string, string>;

export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  row: RawCSVRow;
  reason: string;
}

export interface ImportResult {
  imported: CRMRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  totalRows: number;
}

export type Step = 'upload' | 'preview' | 'result';

export const CRM_COLUMNS: (keyof CRMRecord)[] = [
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
];
