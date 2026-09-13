import React, { useState, useEffect } from 'react';
import {
  fetchPorts,
  fetchCarriers,
  requestQuote,
  fetchFeeSource,
  Port,
  Carrier,
  QuoteResponse,
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

export const QuotePage: React.FC = () => {
  const [ports, setPorts] = useState<Port[]>(DEFAULT_PORTS);
  const [carriers, setCarriers] = useState<Carrier[]>(DEFAULT_CARRIERS);

  const [originPort, setOriginPort] = useState('CNSHA');
  const [destinationPort, setDestinationPort] = useState('USLAX');
  const [carrier, setCarrier] = useState('MAEU');
  const [containerType, setContainerType] = useState('40HC');
  const [incoterm, setIncoterm] = useState('FOB');
  const [commodity, setCommodity] = useState('Consumer Electronics & Apparel');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteResponse | null>(null);

  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);

  const loadDropdownData = () => {
    Promise.all([fetchPorts(), fetchCarriers()])
      .then(([pList, cList]) => {
        if (pList && pList.length > 0) {
          setPorts(pList);
          if (!pList.find(p => p.unlocode === originPort)) {
            setOriginPort(pList[0].unlocode);
          }
          if (!pList.find(p => p.unlocode === destinationPort) && pList.length > 1) {
            setDestinationPort(pList[1].unlocode);
          }
        }
        if (cList && cList.length > 0) {
          setCarriers(cList);
          if (!cList.find(c => c.scac_code === carrier)) {
            setCarrier(cList[0].scac_code);
          }
        }
      })
      .catch((err) => console.warn('Could not load lookup values from API:', err));
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  const handleCalculateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await requestQuote({
        origin_port: originPort,
        destination_port: destinationPort,
        carrier,
        container_type: containerType,
        incoterm,
        commodity,
      });
      setQuoteResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate quote.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSource = async (feeId?: number) => {
    if (!feeId) return;
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
          <h2 className="card-title">Ocean Freight Landed-Cost Quotation</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time accessorial aggregation & Incoterms cost breakdown
          </span>
        </div>

        <form onSubmit={handleCalculateQuote}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Origin Port</label>
              <select
                className="form-select"
                value={originPort}
                onChange={(e) => setOriginPort(e.target.value)}
              >
                {ports.map((p) => (
                  <option key={p.unlocode} value={p.unlocode}>
                    {p.name} ({p.unlocode}, {p.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Destination Port</label>
              <select
                className="form-select"
                value={destinationPort}
                onChange={(e) => setDestinationPort(e.target.value)}
              >
                {ports.map((p) => (
                  <option key={p.unlocode} value={p.unlocode}>
                    {p.name} ({p.unlocode}, {p.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ocean Carrier</label>
              <select
                className="form-select"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              >
                {carriers.map((c) => (
                  <option key={c.scac_code} value={c.scac_code}>
                    {c.name} ({c.scac_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Container Type</label>
              <select
                className="form-select"
                value={containerType}
                onChange={(e) => setContainerType(e.target.value)}
              >
                <option value="20GP">20' General Purpose (20GP)</option>
                <option value="40GP">40' General Purpose (40GP)</option>
                <option value="40HC">40' High Cube (40HC)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Incoterm (2020)</label>
              <select
                className="form-select"
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value)}
              >
                <option value="FOB">FOB - Free on Board (Buyer pays freight + dest)</option>
                <option value="EXW">EXW - Ex Works (Buyer pays all origin, freight & dest)</option>
                <option value="CIF">CIF - Cost, Insurance & Freight (Seller pays freight)</option>
                <option value="CFR">CFR - Cost & Freight (Seller pays freight)</option>
                <option value="FCA">FCA - Free Carrier</option>
                <option value="DAP">DAP - Delivered at Place</option>
                <option value="DDP">DDP - Delivered Duty Paid (Seller pays all)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Commodity Description</label>
              <input
                type="text"
                className="form-input"
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                placeholder="e.g. Dry General Merchandise"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Aggregating Tariffs...' : 'Calculate True Landed Cost'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="warning-box" style={{ borderColor: 'var(--status-rose)', backgroundColor: 'var(--status-rose-bg)' }}>
          <div className="warning-item" style={{ color: 'var(--text-primary)' }}>
            <span>&times;</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {quoteResult && (
        <div>
          {/* Summary KPIs */}
          <div className="summary-grid">
            <div className="summary-card highlight">
              <div className="summary-label">Estimated Landed Cost</div>
              <div className="summary-value" style={{ color: 'var(--accent-blue)' }}>
                ${quoteResult.summary.total_landed_cost_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="summary-note">Total payable under {quoteResult.incoterm} terms</div>
            </div>

            <div className="summary-card">
              <div className="summary-label">Base Ocean Freight</div>
              <div className="summary-value">
                ${quoteResult.summary.ocean_freight_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="summary-note">Liner port-to-port + BAF/CAF surcharges</div>
            </div>

            <div className="summary-card">
              <div className="summary-label">Origin Accessorials</div>
              <div className="summary-value">
                ${quoteResult.summary.origin_charges_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="summary-note">Export THC, DOC, and port regulatory dues</div>
            </div>

            <div className="summary-card">
              <div className="summary-label">Destination Accessorials</div>
              <div className="summary-value">
                ${quoteResult.summary.destination_charges_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="summary-note">Import discharge THC, security, & harbor dues</div>
            </div>
          </div>

          {/* Warnings Section */}
          {quoteResult.warnings && quoteResult.warnings.length > 0 && (
            <div className="warning-box">
              <strong style={{ fontSize: '0.85rem', color: 'var(--status-amber)', display: 'block', marginBottom: '0.4rem' }}>
                Operational Tariffs & Advisory Warnings:
              </strong>
              {quoteResult.warnings.map((w, idx) => (
                <div key={idx} className="warning-item">
                  <span>&#9888;</span>
                  <span>
                    <strong>[{w.fee_code || 'NOTICE'}]:</strong> {w.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Detailed Breakdown Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                Itemized Fee & Accessorial Breakdown ({quoteResult.line_items.length} line items)
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Lane: {quoteResult.origin_port_name} &rarr; {quoteResult.destination_port_name} &bull; Carrier: {quoteResult.carrier_name}
              </span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Fee Code</th>
                    <th>Charge Description</th>
                    <th>Type</th>
                    <th>Original Amount</th>
                    <th>Amount (USD)</th>
                    <th>Responsibility</th>
                    <th>Confidence</th>
                    <th>Source Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteResult.line_items.map((item, idx) => (
                    <tr key={idx} style={{ opacity: item.included_in_landed_cost ? 1 : 0.65 }}>
                      <td>
                        <span className="badge badge-category">{item.category}</span>
                      </td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{item.fee_code}</strong>
                      </td>
                      <td>
                        <div>{item.fee_name}</div>
                        {item.conditions && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.conditions}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-blue">{item.fee_type}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {item.currency} {item.amount.toFixed(2)} / {item.unit}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        ${item.converted_amount_usd.toFixed(2)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.payer === 'buyer' ? 'badge-green' : 'badge-amber'
                          }`}
                        >
                          {item.payer.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.confidence >= 0.85 ? 'badge-green' : 'badge-amber'
                          }`}
                        >
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          onClick={() => handleViewSource(item.id)}
                          disabled={loadingSource}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                        >
                          View Snippet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />
    </div>
  );
};
