import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { QuotePage } from './pages/QuotePage';
import { FeesBrowsePage } from './pages/FeesBrowsePage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quote' | 'browse'>('quote');

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'quote' ? <QuotePage /> : <FeesBrowsePage />}
      </main>
    </div>
  );
};

export default App;
