import React, { useState, useEffect } from 'react';
import {
  fetchPorts,
  fetchCarriers,
  fetchFees,
  triggerRefresh,
  fetchFeeSource,
  Port,
  Carrier,
  Fee,
  Source,
} from '../api/client';
import { SourceModal } from '../components/SourceModal';

const DEFAULT_PORTS: Port[] = [
  { id: 1, unlocode: 'CNSHA', name: 'Shanghai Port', country: 'CN' },
  { id: 2, unlocode: 'USLAX', name: 'Port of Los Angeles', country: 'US' },
  { id: 3, unlocode: 'NLRTM', name: 'Port of Rotterdam', country: 'NL' },
];

const DEFAULT_CARRIERS: Carrier[] = [
  { id: 1, scac_code: 'MAEU', name: 'Maersk Line' },
  { id: 2, scac_code: 'MSCU', name: 'MSC (Mediterranean Shipping Company)' },
];

export const FeesBrowsePage: React.FC = () => {
  const [ports, setPorts] = useState<Port[]>(DEFAULT_PORTS);
  const [carriers, setCarriers] = useState<Carrier[]>(DEFAULT_CARRIERS);

  const [selectedPort, setSelectedPort] = useState<string>('');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [selectedFeeType, setSelectedFeeType] = useState<string>('');

  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);

  useEffect(() => {
    Promise.all([fetchPorts(), fetchCarriers()])
      .then(([pList, cList]) => {
        if (pList && pList.length > 0) setPorts(pList);
        if (cList && cList.length > 0) setCarriers(cList);
      })
      .catch((err) => console.warn('Lookup error:', err));
  }, []);

  const loadFees = async () => {
    setLoading(true);
    try {
      const data = await fetchFees(selectedPort || undefined, selectedCarrier || undefined, selectedFeeType || undefined);
      setFees(data);
    } catch (err: any) {
      console.error('Error fetching fees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [selectedPort, selectedCarrier, selectedFeeType]);

  const handleRefreshPipeline = async () => {
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const res = await triggerRefresh();
      setRefreshMessage(`✓ ${res.message} ${res.extracted_fees_count !== undefined ? `(${res.extracted_fees_count} fees extracted)` : ''}`);
      await loadFees();
    } catch (err: any) {
      setRefreshMessage(`Error refreshing sources: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewSource = async (feeId: number) => {
    setLoadingSource(true);
    try {
      const src = await fetchFeeSource(feeId);
      setSelectedSource(src);
    } catch (err: any) {
      alert(`Could not fetch source snippet: ${err.message}`);
    } finally {
      setLoadingSource(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Normalized Tariff & Accessorial Fee Repository</h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Tariff line items extracted and mapped to canonical schema
            </span>
          </div>
          <button
            className="btn-primary"
            onClick={handleRefreshPipeline}
            disabled={refreshing}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            {refreshing ? 'Re-crawling Sources...' : '⟳ Trigger Pipeline Refresh'}
          </button>
        </div>

        {refreshMessage && (
          <div
            className="warning-box"
            style={{
              marginBottom: '1rem',
              borderColor: 'var(--status-green)',
              backgroundColor: 'var(--status-green-bg)',
            }}
          >
            <div className="warning-item" style={{ color: 'var(--status-green)' }}>
              <span>{refreshMessage}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="form-grid" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Filter by Port</label>
            <select
              className="form-select"
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
            >
              <option value="">All Ports (Global)</option>
              {ports.map((p) => (
                <option key={p.unlocode} value={p.unlocode}>
                  {p.name} ({p.unlocode})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Filter by Carrier</label>
            <select
              className="form-select"
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
            >
              <option value="">All Ocean Carriers</option>
              {carriers.map((c) => (
                <option key={c.scac_code} value={c.scac_code}>
                  {c.name} ({c.scac_code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Filter by Fee Type</label>
            <select
              className="form-select"
              value={selectedFeeType}
              onChange={(e) => setSelectedFeeType(e.target.value)}
            >
              <option value="">All Canonical Types</option>
              <option value="THC">THC (Terminal Handling)</option>
              <option value="BAF">BAF (Bunker Adjustment)</option>
              <option value="CAF">CAF (Currency Adjustment)</option>
              <option value="ISPS">ISPS (Security)</option>
              <option value="DOC">DOC (Documentation / BL)</option>
              <option value="DEMURRAGE">DEMURRAGE</option>
              <option value="OTHER">OTHER (Harbor, Dues, Inspections)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fees Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Database Records ({fees.length} line items)</h3>
          {loading && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading...</span>}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fee Code</th>
                <th>Canonical Type</th>
                <th>Port</th>
                <th>Carrier</th>
                <th>Container</th>
                <th>Rate</th>
                <th>Unit</th>
                <th>Confidence</th>
                <th>Conditions / Rules</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 && !loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No fees matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                fees.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{f.id}</td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{f.fee_code}</strong>
                    </td>
                    <td>
                      <span className="badge badge-blue">{f.fee_type}</span>
                    </td>
                    <td>
                      <span className="badge badge-category">
                        {f.port_unlocode || `Port #${f.port_id}`}
                      </span>
                    </td>
                    <td>
                      {f.carrier_scac ? (
                        <span className="badge badge-category">{f.carrier_scac}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Universal</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{f.container_type || 'ALL'}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-blue)' }}>
                      {f.currency} {f.amount.toFixed(2)}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{f.unit}</td>
                    <td>
                      <span className={`badge ${f.confidence >= 0.85 ? 'badge-green' : 'badge-amber'}`}>
                        {(f.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {f.conditions_json || '-'}
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        onClick={() => handleViewSource(f.id)}
                        disabled={loadingSource}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />
    </div>
  );
};
