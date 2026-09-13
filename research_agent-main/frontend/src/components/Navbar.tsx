import React from 'react';

interface NavbarProps {
  activeTab: 'quote' | 'browse';
  onSelectTab: (tab: 'quote' | 'browse') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-icon">⚓</div>
          <div>
            <div className="brand-title">FreightLanded</div>
            <div className="brand-subtitle">Ocean Freight Landed-Cost Agent</div>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'quote' ? 'active' : ''}`}
            onClick={() => onSelectTab('quote')}
          >
            Quote Estimator
          </button>
          <button
            className={`nav-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => onSelectTab('browse')}
          >
            Browse Fees Table
          </button>
        </nav>
      </div>
    </header>
  );
};
