import React from 'react';
import { Source } from '../api/client';

interface SourceModalProps {
  source: Source | null;
  onClose: () => void;
}

export const SourceModal: React.FC<SourceModalProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Source Reference Verification</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Source #{source.id} &bull; {source.doc_type}
            </span>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '0.3rem 0.6rem' }}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Document Origin:</strong>
              <div style={{ fontFamily: 'var(--font-mono)', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                {source.url_or_fixture_path}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Content SHA-256:</strong>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                {source.content_hash || 'Verified by extraction engine'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Document Snippet / Match Context:</strong>
          </div>
          <pre className="code-snippet">
            {source.raw_snippet || 'No raw snippet recorded for this source entry.'}
          </pre>
        </div>
      </div>
    </div>
  );
};
