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
  Layers,
} from 'lucide-react'
import { AgentAnalysisInput, AgentAnalysisResult, HiddenCostItem } from './types'
import { SAMPLE_AGENT_INPUT, SAMPLE_AGENT_RESULT } from './mockData'

export default function AgentPanel() {
  const [inputs, setInputs] = useState<AgentAnalysisInput>(SAMPLE_AGENT_INPUT)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [results, setResults] = useState<AgentAnalysisResult | null>(SAMPLE_AGENT_RESULT)

  const steps = [
    'Benchmarking port terminal tariff schedules...',
    'Evaluating destination dwell index & demurrage free days...',
    'Modeling customs inspection dues & electronic manifest fees...',
    'Synthesizing freight intelligence variance & recommendations...',
  ]

  const handlePreFill = () => {
    setInputs(SAMPLE_AGENT_INPUT)
    setResults(SAMPLE_AGENT_RESULT)
  }

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    setAnalysisStep(0)

    // Progressive intelligence analysis simulation
    const interval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 400)

    setTimeout(() => {
      clearInterval(interval)
      const baseQuote = Number(inputs.quotedRate) || 2850
      const minAddition = Math.round(baseQuote * 0.14)
      const maxAddition = Math.round(baseQuote * 0.20)

      const calculatedResult: AgentAnalysisResult = {
        ...SAMPLE_AGENT_RESULT,
        quotedRate: baseQuote,
        estimatedMinLandedCost: baseQuote + minAddition,
        estimatedMaxLandedCost: baseQuote + maxAddition,
        variancePercent: Number(((maxAddition / baseQuote) * 100).toFixed(1)),
        timestamp: 'Computed just now from simulated maritime rate indices',
        isSimulated: true,
      }

      setResults(calculatedResult)
      setIsAnalyzing(false)
    }, 1800)
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
            Varka Agent analyzes your voyage and helps identify potential hidden costs before they become surprises.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePreFill}
          className="varka-prefill-btn"
          title="Populate fields with sample voyage charter parameters"
        >
          <Layers size={13} />
          <span>Pre-fill Sample Voyage</span>
        </button>
      </div>

      {/* Voyage Input Form Card */}
      <div className="varka-agent-form-card">
        <div className="varka-card-header-bar">
          <div className="varka-section-kicker-group">
            <FileText size={14} className="varka-rust-icon" />
            <span className="varka-section-kicker">VOYAGE SPECIFICATION</span>
          </div>
          <span className="varka-form-hint">All parameters used for risk simulation</span>
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
                CARGO CLASSIFICATION
              </label>
              <input
                id="agent-cargo"
                type="text"
                required
                value={inputs.cargoType}
                onChange={(e) => setInputs({ ...inputs, cargoType: e.target.value })}
                placeholder="e.g. Industrial Bulk Minerals / Machinery"
                className="varka-field-input"
              />
            </div>

            {/* Cargo Volume */}
            <div className="varka-agent-field">
              <label htmlFor="agent-volume" className="varka-field-label">
                CARGO VOLUME / WEIGHT
              </label>
              <input
                id="agent-volume"
                type="text"
                required
                value={inputs.cargoVolume}
                onChange={(e) => setInputs({ ...inputs, cargoVolume: e.target.value })}
                placeholder="e.g. 450 MT (18 FEU)"
                className="varka-field-input"
              />
            </div>

            {/* Container Type */}
            <div className="varka-agent-field">
              <label htmlFor="agent-container" className="varka-field-label">
                EQUIPMENT / CONTAINER TYPE
              </label>
              <input
                id="agent-container"
                type="text"
                required
                value={inputs.containerType}
                onChange={(e) => setInputs({ ...inputs, containerType: e.target.value })}
                placeholder="e.g. 40ft High Cube / 20ft Standard"
                className="varka-field-input"
              />
            </div>

            {/* Quoted Rate */}
            <div className="varka-agent-field">
              <label htmlFor="agent-rate" className="varka-field-label">
                QUOTED FREIGHT RATE (USD)
              </label>
              <div className="varka-rate-input-wrap">
                <span className="varka-rate-prefix">$</span>
                <input
                  id="agent-rate"
                  type="number"
                  min={1}
                  required
                  value={inputs.quotedRate}
                  onChange={(e) =>
                    setInputs({ ...inputs, quotedRate: Number(e.target.value) || 0 })
                  }
                  placeholder="2850"
                  className="varka-field-input is-rate"
                />
              </div>
            </div>
          </div>

          <div className="varka-agent-submit-row">
            <button
              type="submit"
              disabled={isAnalyzing || !inputs.origin || !inputs.destination}
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
      {results && (
        <div className="varka-agent-results-wrap">
          {/* Summary Variance Banner */}
          <div className="varka-agent-summary-card">
            <div className="varka-summary-header-row">
              <div>
                <span className="varka-section-kicker">ANALYSIS FINDINGS</span>
                <h3 className="varka-summary-title">Potential Hidden Costs & Landed Exposure</h3>
              </div>
              <div className="varka-sim-badge is-agent">
                <span>SIMULATED MODEL — BENCHMARK DATA</span>
              </div>
            </div>

            <div className="varka-summary-metrics-grid">
              <div className="varka-summary-cell">
                <span className="varka-summary-label">ORIGINAL QUOTED FREIGHT</span>
                <span className="varka-summary-value is-muted">
                  ${results.quotedRate.toLocaleString()}
                </span>
                <span className="varka-summary-footnote">Base ocean transport fee</span>
              </div>

              <div className="varka-summary-cell">
                <span className="varka-summary-label">PREDICTED TRUE LANDED COST</span>
                <span className="varka-summary-value is-accent">
                  ${results.estimatedMinLandedCost.toLocaleString()} — $
                  {results.estimatedMaxLandedCost.toLocaleString()}
                </span>
                <span className="varka-summary-footnote">
                  +${(results.estimatedMinLandedCost - results.quotedRate).toLocaleString()} to +$
                  {(results.estimatedMaxLandedCost - results.quotedRate).toLocaleString()} variance
                </span>
              </div>

              <div className="varka-summary-cell">
                <span className="varka-summary-label">HIDDEN COST EXPOSURE</span>
                <div className="varka-variance-chip">
                  <TrendingUp size={14} />
                  <span>+{results.variancePercent}%</span>
                </div>
                <span className="varka-summary-footnote">Above carrier baseline quote</span>
              </div>

              <div className="varka-summary-cell">
                <span className="varka-summary-label">OVERALL SURCHARGE RISK</span>
                <div className="varka-risk-chip is-moderate">
                  <AlertTriangle size={13} />
                  <span>{results.riskIndex} Risk Exposure</span>
                </div>
                <span className="varka-summary-footnote">High probability of demurrage dwell</span>
              </div>
            </div>
          </div>

          {/* Breakdown Cards of Potential Hidden Cost Categories */}
          <div className="varka-cost-breakdown-card">
            <div className="varka-card-header-bar">
              <div className="varka-section-kicker-group">
                <DollarSign size={14} className="varka-rust-icon" />
                <span className="varka-section-kicker">SURCHARGE BREAKDOWN CATEGORIES</span>
              </div>
              <span className="varka-form-hint">{results.costCategories.length} Surcharge Vectors Modeled</span>
            </div>

            <div className="varka-cost-categories-grid">
              {results.costCategories.map((cat: HiddenCostItem) => (
                <div key={cat.id} className="varka-cost-card">
                  <div className="varka-cost-card-top">
                    <div className="varka-cost-cat-title-group">
                      <span className="varka-cost-code">{cat.code}</span>
                      <h4 className="varka-cost-title">{cat.category}</h4>
                    </div>

                    <div className="varka-cost-range-badge">
                      <span>
                        +${cat.estimatedMin} — ${cat.estimatedMax}
                      </span>
                    </div>
                  </div>

                  <p className="varka-cost-explanation">{cat.explanation}</p>

                  <div className="varka-cost-advice-box">
                    <div className="varka-advice-header">
                      <Lightbulb size={12} className="varka-rust-icon" />
                      <span>TACTICAL MITIGATION:</span>
                    </div>
                    <p className="varka-advice-text">{cat.tacticalAdvice}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Tactical Recommendations */}
          <div className="varka-recommendations-card">
            <div className="varka-card-header-bar">
              <div className="varka-section-kicker-group">
                <CheckCircle size={14} className="varka-rust-icon" />
                <span className="varka-section-kicker">INTELLIGENCE RECOMMENDATIONS</span>
              </div>
              <span className="varka-form-hint">Negotiation playbook to eliminate unexpected fees</span>
            </div>

            <ul className="varka-recommendations-list">
              {results.keyRecommendations.map((rec, idx) => (
                <li key={idx} className="varka-rec-item">
                  <span className="varka-rec-index">0{idx + 1}</span>
                  <p className="varka-rec-text">{rec}</p>
                </li>
              ))}
            </ul>

            <div className="varka-agent-disclaimer">
              <HelpCircle size={13} className="varka-subtle-icon" />
              <span>
                <strong>SIMULATED PREDICTIONS NOTE:</strong> Calculations represent benchmarked maritime intelligence models calibrated against historic port tariff disclosures and coastal shipping rate indices. Connect to real AI endpoints by binding live API handlers.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
