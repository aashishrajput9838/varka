function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:8001`;
  }
  return envUrl || 'http://localhost:8001';
}

export const API_BASE_URL = getApiBaseUrl();

export interface Port {
  id: number;
  unlocode: string;
  name: string;
  country: string;
}

export interface Carrier {
  id: number;
  name: string;
  scac_code: string;
}

export interface Fee {
  id: number;
  source_id: number;
  fee_code: string;
  fee_type: string;
  port_id: number;
  port_unlocode?: string;
  port_name?: string;
  carrier_id?: number;
  carrier_name?: string;
  carrier_scac?: string;
  container_type?: string;
  amount: number;
  currency: string;
  unit: string;
  conditions_json?: string;
  effective_date?: string;
  expiry_date?: string;
  confidence: number;
  extracted_at: string;
  source_reference?: string;
}

export interface Source {
  id: number;
  url_or_fixture_path: string;
  doc_type: string;
  port_id?: number;
  port_unlocode?: string;
  carrier_id?: number;
  carrier_scac?: string;
  last_crawled_at?: string;
  content_hash?: string;
  raw_snippet?: string;
}

export interface QuoteRequest {
  origin_port: string;
  destination_port: string;
  carrier: string;
  container_type: string;
  incoterm: string;
  commodity?: string;
}

export interface FeeLineItem {
  id?: number;
  fee_code: string;
  fee_name: string;
  fee_type: string;
  category: 'origin' | 'freight' | 'destination';
  amount: number;
  currency: string;
  converted_amount_usd: number;
  unit: string;
  payer: 'buyer' | 'seller';
  included_in_landed_cost: boolean;
  confidence: number;
  source_reference: string;
  conditions?: string;
}

export interface CostBreakdown {
  origin_charges_usd: number;
  ocean_freight_usd: number;
  destination_charges_usd: number;
  total_landed_cost_usd: number;
  currency: string;
}

export interface WarningItem {
  level: 'info' | 'warning' | 'caution';
  fee_code?: string;
  message: string;
}

export interface QuoteResponse {
  origin_port: string;
  origin_port_name: string;
  destination_port: string;
  destination_port_name: string;
  carrier: string;
  carrier_name: string;
  container_type: string;
  incoterm: string;
  commodity?: string;
  summary: CostBreakdown;
  line_items: FeeLineItem[];
  warnings: WarningItem[];
  calculated_at: string;
}

export interface RefreshResponse {
  status: string;
  message: string;
  task_id?: string;
  source_id?: number;
  extracted_fees_count?: number;
}

export async function fetchPorts(search?: string): Promise<Port[]> {
  const url = new URL(`${API_BASE_URL}/v1/ports`);
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch ports: ${res.statusText}`);
  return res.json();
}

export async function fetchCarriers(search?: string): Promise<Carrier[]> {
  const url = new URL(`${API_BASE_URL}/v1/carriers`);
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch carriers: ${res.statusText}`);
  return res.json();
}

export async function fetchFees(port?: string, carrier?: string, feeType?: string): Promise<Fee[]> {
  const url = new URL(`${API_BASE_URL}/v1/fees`);
  if (port) url.searchParams.set('port', port);
  if (carrier) url.searchParams.set('carrier', carrier);
  if (feeType) url.searchParams.set('fee_type', feeType);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch fees: ${res.statusText}`);
  return res.json();
}

export async function fetchFeeSource(feeId: number): Promise<Source> {
  const res = await fetch(`${API_BASE_URL}/v1/fees/${feeId}/source`);
  if (!res.ok) throw new Error(`Failed to fetch fee source: ${res.statusText}`);
  return res.json();
}

export async function requestQuote(payload: QuoteRequest): Promise<QuoteResponse> {
  const res = await fetch(`${API_BASE_URL}/v1/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to calculate quote: ${res.statusText}`);
  }
  return res.json();
}

export async function triggerRefresh(sourceId?: number): Promise<RefreshResponse> {
  const res = await fetch(`${API_BASE_URL}/v1/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_id: sourceId }),
  });
  if (!res.ok) throw new Error(`Failed to trigger refresh: ${res.statusText}`);
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; database: string }> {
  const res = await fetch(`${API_BASE_URL}/v1/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}
