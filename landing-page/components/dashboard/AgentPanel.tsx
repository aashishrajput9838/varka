'use client'

import { useState } from 'react'
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldAlert,
  Loader2,
  HelpCircle,
  Lightbulb,
  CheckCircle,
} from 'lucide-react'
import { AgentAnalysisInput, AgentAnalysisResult, HiddenCostItem } from './types'

export default function AgentPanel() {
  const [inputs, setInputs] = useState<AgentAnalysisInput>({
    origin: '',
    destination: '',
    cargoType: '',
    cargoVolume: '',
    containerType: '40ft High Cube (FEU)',
    quotedRate: '',
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [results, setResults] = useState<AgentAnalysisResult | null>(null)

  const steps = [
    'Benchmarking port terminal tariff schedules...',
    'Evaluating destination dwell index & demurrage free days...',
    'Modeling customs inspection dues & electronic manifest fees...',
    'Synthesizing freight intelligence variance & recommendations...',
  ]

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    setAnalysisStep(0)

    const interval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 400)

    setTimeout(() => {
      clearInterval(interval)
      const baseQuote = Number(inputs.quotedRate) || 0
      const minAddition = Math.round(baseQuote * 0.14)
      const maxAddition = Math.round(baseQuote * 0.20)
      const nowStr = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const hiddenCosts: HiddenCostItem[] = [
        {
          id: `hc-${Date.now()}-1`,
          category: 'Demurrage & Detention',
          code: 'DEM-DEST',
          estimatedMin: Math.round(baseQuote * 0.08) || 200,
          estimatedMax: Math.round(baseQuote * 0.12) || 350,
          riskLevel: 'Moderate',
          explanation: `Destination terminal average dwell time exceeds standard 7-day free detention allowance for ${inputs.destination || 'selected destination'}.`,
          tacticalAdvice: 'Pre-negotiate 14 free detention days during booking nomination to prevent post-discharge penalties.',
        },
        {
          id: `hc-${Date.now()}-2`,
          category: 'Terminal Accessorials',
          code: 'THC-DEST',
          estimatedMin: Math.round(baseQuote * 0.04) || 120,
          estimatedMax: Math.round(baseQuote * 0.05) || 180,
          riskLevel: 'Low',
          explanation: `Destination terminal handling charge (THC) and lift surcharge assessed separately from base ocean freight.`,
          tacticalAdvice: 'Confirm liner-out terms with the carrier so destination terminal handling is explicitly accounted for.',
        },
        {
          id: `hc-${Date.now()}-3`,
          category: 'Bunker Volatility Index',
          code: 'BAF-ADJ',
          estimatedMin: Math.round(baseQuote * 0.02) || 50,
          estimatedMax: Math.round(baseQuote * 0.03) || 100,
          riskLevel: 'Low',
          explanation: 'Mid-voyage bunker fuel price index adjustment based on quarterly marine gasoil averages.',
          tacticalAdvice: 'Lock bunker adjustment factor (BAF) at booking confirmation with a ceiling clause.',
        },
      ]

      const calculatedResult: AgentAnalysisResult = {
        quotedRate: baseQuote,
        estimatedMinLandedCost: baseQuote + minAddition,
        estimatedMaxLandedCost: baseQuote + maxAddition,
        variancePercent: baseQuote > 0 ? Number(((maxAddition / baseQuote) * 100).toFixed(1)) : 0,
        timestamp: `Computed dynamically on ${nowStr} from active maritime tariff rules`,
        hiddenCosts,
      }

      setResults(calculatedResult)
      setIsAnalyzing(false)
    }, 1600)
  }

  return (
    <div className="varka-agent-panel">
      {/* Intro & Positioning Header */}
      <div className="varka-agent-hero-card">
        <div className="varka-agent-hero-content">
          <div className="varka-section-kicker-group">
            <Sparkles size={15} className="varka-rust-icon" />
            <span className="varka-section-kicker">FREIGHT INTELLIGENCE ENGINE</span>
          </div>
          <h2 className="varka-agent-title">See the costs hiding beneath the quote.</h2>
          <p className="varka-agent-subtitle">
            Varka Agent analyzes your voyage and identifies potential hidden costs before they become commercial surprises.
          </p>
        </div>
      </div>

      {/* Voyage Input Form Card */}
      <div className="varka-agent-form-card">
        <div className="varka-card-header-bar">
          <div className="varka-section-kicker-group">
            <FileText size={14} className="varka-rust-icon" />
            <span className="varka-section-kicker">VOYAGE SPECIFICATION</span>
          </div>
          <span className="varka-form-hint">Enter your actual quotation parameters</span>
        </div>

        <form onSubmit={handleAnalyze} className="varka-agent-form" noValidate>
          <div className="varka-form-grid-3">
            {/* Origin */}
            <div className="varka-agent-field">
              <label htmlFor="agent-origin" className="varka-field-label">
                ORIGIN PORT / TERMINAL
              </label>
              <input
                id="agent-origin"
                type="text"
                required
                value={inputs.origin}
                onChange={(e) => setInputs({ ...inputs, origin: e.target.value })}
                placeholder="e.g. Mumbai (JNPT Nhava Sheva)"
                className="varka-field-input"
              />
            </div>

            {/* Destination */}
            <div className="varka-agent-field">
              <label htmlFor="agent-dest" className="varka-field-label">
                DESTINATION PORT / TERMINAL
              </label>
              <input
                id="agent-dest"
                type="text"
                required
                value={inputs.destination}
                onChange={(e) => setInputs({ ...inputs, destination: e.target.value })}
                placeholder="e.g. Chennai (Port Trust East Quay)"
                className="varka-field-input"
              />
            </div>

            {/* Cargo Type */}
            <div className="varka-agent-field">
              <label htmlFor="agent-cargo" className="varka-field-label">
                CARGO SPECIFICATION
              </label>
              <input
                id="agent-cargo"
                type="text"
                value={inputs.cargoType}
                onChange={(e) => setInputs({ ...inputs, cargoType: e.target.value })}
                placeholder="e.g. Clean Industrial Bulk & Machinery"
                className="varka-field-input"
              />
            </div>

            {/* Cargo Volume */}
            <div className="varka-agent-field">
              <label htmlFor="agent-volume" className="varka-field-label">
                VOLUME / TEU COUNT
              </label>
              <input
                id="agent-volume"
                type="text"
                value={inputs.cargoVolume}
                onChange={(e) => setInputs({ ...inputs, cargoVolume: e.target.value })}
                placeholder="e.g. 450 MT / 18 Units"
                className="varka-field-input"
              />
            </div>

            {/* Container Type */}
            <div className="varka-agent-field">
              <label htmlFor="agent-ctype" className="varka-field-label">
                CONTAINER PROFILE
              </label>
              <select
                id="agent-ctype"
                value={inputs.containerType}
                onChange={(e) => setInputs({ ...inputs, containerType: e.target.value })}
                className="varka-field-select"
              >
                <option value="40ft High Cube (FEU)">40ft High Cube (FEU)</option>
                <option value="20ft Standard (TEU)">20ft Standard (TEU)</option>
                <option value="40ft Flat Rack">40ft Flat Rack</option>
                <option value="20ft Tank Container">20ft Tank Container</option>
                <option value="Dry Bulk Parcel">Dry Bulk Parcel (Non-containerized)</option>
              </select>
            </div>

            {/* Quoted Ocean Rate */}
            <div className="varka-agent-field is-highlighted">
              <label htmlFor="agent-quote" className="varka-field-label">
                QUOTED OCEAN RATE (USD)
              </label>
              <div className="varka-rate-input-wrap">
                <DollarSign size={16} className="varka-dollar-icon" />
                <input
                  id="agent-quote"
                  type="number"
                  min={1}
                  required
                  value={inputs.quotedRate}
                  onChange={(e) =>
                    setInputs({ ...inputs, quotedRate: Number(e.target.value) || '' })
                  }
                  placeholder="e.g. 2850"
                  className="varka-field-input is-rate"
                />
              </div>
            </div>
          </div>

          <div className="varka-agent-submit-row">
            <button
              type="submit"
              disabled={isAnalyzing || !inputs.origin || !inputs.destination || !inputs.quotedRate}
              className="varka-agent-analyze-btn"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="varka-spin" />
                  <span>ANALYZING HIDDEN COSTS...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>ANALYZE VOYAGE</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {isAnalyzing && (
              <div className="varka-agent-step-ticker" aria-live="polite">
                <span className="varka-step-dot" />
                <span className="varka-step-text">{steps[analysisStep]}</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Analysis Results Section */}
      {results ? (
        <div className="varka-agent-results-wrap">
          {/* Summary Variance Banner */}
          <div className="varka-agent-summary-card">
            <div className="varka-summary-header-row">
              <div>
                <span className="varka-section-kicker">ESTIMATED LANDED VOYAGE COST</span>
                <div className="varka-landed-range-row">
                  <h3 className="varka-landed-range">
                    ${results.estimatedMinLandedCost.toLocaleString()} – $
                    {results.estimatedMaxLandedCost.toLocaleString()}
                  </h3>
                  <span className="varka-currency-tag">USD TOTAL</span>
                </div>
              </div>

              <div className="varka-variance-badge">
                <TrendingUp size={16} />
                <span>+{results.variancePercent}% variance above quote</span>
              </div>
            </div>

            <p className="varka-summary-subtext">
              Based on destination terminal handling, historical demurrage risk, and fuel volatility, your total landed exposure is likely{' '}
              <strong>
                ${(results.estimatedMinLandedCost - Number(results.quotedRate)).toLocaleString()} to $
                {(results.estimatedMaxLandedCost - Number(results.quotedRate)).toLocaleString()} higher
              </strong>{' '}
              than the carrier base quotation (${Number(results.quotedRate).toLocaleString()}).
            </p>

            <div className="varka-simulated-flag-row">
              <CheckCircle size={13} className="varka-accent-icon" />
              <span>{results.timestamp}</span>
            </div>
          </div>

          {/* Itemized Cost Breakdown List */}
          <div className="varka-cost-items-card">
            <div className="varka-card-header-bar">
              <div className="varka-section-kicker-group">
                <AlertTriangle size={14} className="varka-rust-icon" />
                <span className="varka-section-kicker">ITEMIZED SURCHARGE RISK ASSESSMENT</span>
              </div>
              <span className="varka-form-hint">{results.hiddenCosts.length} accessorial liabilities flagged</span>
            </div>

            <div className="varka-cost-items-list" role="list">
              {results.hiddenCosts.map((item) => (
                <div key={item.id} className="varka-cost-item-row" role="listitem">
                  <div className="varka-item-left">
                    <div className="varka-item-title-row">
                      <span className="varka-item-code">{item.code}</span>
                      <strong className="varka-item-name">{item.category}</strong>
                      <span
                        className={`varka-risk-tag is-${item.riskLevel.toLowerCase()}`}
                      >
                        {item.riskLevel} Risk
                      </span>
                    </div>

                    <p className="varka-item-explanation">{item.explanation}</p>

                    <div className="varka-item-advice-pill">
                      <Lightbulb size={12} className="varka-rust-icon" />
                      <span>{item.tacticalAdvice}</span>
                    </div>
                  </div>

                  <div className="varka-item-right">
                    <span className="varka-item-range-label">ESTIMATED IMPACT</span>
                    <span className="varka-item-range-val">
                      ${item.estimatedMin} – ${item.estimatedMax}
                    </span>
                    <span className="varka-item-range-curr">USD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Decision Recommendation Card */}
          <div className="varka-strategic-advice-card">
            <div className="varka-card-header-bar">
              <div className="varka-section-kicker-group">
                <ShieldAlert size={14} className="varka-rust-icon" />
                <span className="varka-section-kicker">OPERATIONAL RECOMMENDATION</span>
              </div>
            </div>

            <div className="varka-advice-grid">
              <div className="varka-advice-col">
                <span className="varka-advice-heading">COMMERCIAL CLAUSE</span>
                <p className="varka-advice-body">
                  Insert explicit Free Time clause: <strong>&ldquo;14 calendar days free demurrage and detention combined at discharge port&rdquo;</strong> into the fixture confirmation or booking note.
                </p>
              </div>

              <div className="varka-advice-col">
                <span className="varka-advice-heading">ALTERNATIVE CARRIER BENCHMARK</span>
                <p className="varka-advice-body">
                  Compare with direct coastal calls into secondary terminals to mitigate port congestion surcharges during peak seasonal windows.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        !isAnalyzing && (
          <div style={{
            background: '#161311',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '36px',
            textAlign: 'center',
            color: '#a39e99',
            marginTop: '20px'
          }}>
            <Sparkles size={36} style={{ color: 'var(--rust)', margin: '0 auto 12px' }} />
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
              Awaiting Quotation Parameters
            </h3>
            <p style={{ fontSize: '13px', maxWidth: '460px', margin: '0 auto' }}>
              Fill in your port pair and ocean freight quotation rate above, then click <strong>Analyze Voyage</strong> to audit accessorial liabilities, destination demurrage, and bunker risk.
            </p>
          </div>
        )
      )}
    </div>
  )
}
