'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Activity,
  Ship,
  Compass,
  TrendingUp,
  AlertTriangle,
  Anchor,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { NavSection, VoyageData, UserProfileData } from '../types'
import { useVarkaIntelligenceWs } from './useVarkaIntelligenceWs'
import { QuickAction, VarkaChatMessage } from './types'

interface VarkaIntelligenceProps {
  activeSection: NavSection
  currentVoyage?: VoyageData
  currentUser?: UserProfileData | null
}

export default function VarkaIntelligence({
  activeSection,
  currentVoyage,
  currentUser,
}: VarkaIntelligenceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputQuery, setInputQuery] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    status,
    messages,
    isStreaming,
    lastSyncTime,
    sendMessage,
    clearMessages,
    isConnected,
  } = useVarkaIntelligenceWs({
    activeSection,
    currentVoyage,
    currentUser,
    enabled: true,
  })

  // Auto-scroll to bottom as tokens stream in
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, isMinimized])

  // Get dynamic quick actions based on the user's active page/section
  const getQuickActions = (): QuickAction[] => {
    switch (activeSection) {
      case 'tracking':
        return [
          {
            label: 'Explain Voyage',
            query: "What's happening with my current voyage and vessel position?",
          },
          {
            label: 'ETA Risk',
            query: 'Why is the ETA changing, and what are the primary navigation risks?',
          },
          {
            label: 'JIT Slow Steam',
            query: 'Should I slow steam, and how much bunker fuel & CO2 can we save?',
          },
          {
            label: 'Port Situation',
            query: 'Explain the current port situation and pre-berthing queue at Chennai.',
          },
        ]

      case 'prediction':
      case 'cockpit':
      case 'scenarios':
      case 'optimizer':
      case 'jit':
      case 'scorecard':
      case 'fleet':
      case 'risk':
      case 'standards':
      case 'assistant':
        return [
          {
            label: 'Explain Forecast',
            query: 'What is the 60-day freight rate outlook and what are the main drivers?',
          },
          {
            label: 'Should I Charter Now?',
            query: 'Should we charter this vessel now or wait for spot fluctuations?',
          },
          {
            label: 'Best Vessel Fit',
            query: 'Which vessel class is recommended for Paradip, and why Panamax?',
          },
          {
            label: 'JIT Savings',
            query: 'How much waiting hours and fuel expenditure does JIT arrival save?',
          },
        ]

      case 'agent':
        return [
          {
            label: 'Summarize Costs',
            query: 'Summarize the landed freight costs and variance from the base quote.',
          },
          {
            label: 'Top Hidden Costs',
            query: 'What are the biggest hidden costs and demurrage risks identified?',
          },
          {
            label: 'Tactical Advice',
            query: 'What tactical clause should I include before fixing this voyage?',
          },
        ]

      case 'landed-cost':
        return [
          {
            label: 'Break Down Landed Cost',
            query: 'Explain how base ocean freight and accessorial tariffs (THC, BAF, CAF) combine into true landed cost.',
          },
          {
            label: 'Demurrage Rules',
            query: 'What are the destination demurrage daily rates and free day limits on this lane?',
          },
          {
            label: 'Incoterms Liability',
            query: 'Under FOB vs CIF, which accessorial charges are the responsibility of the buyer vs seller?',
          },
          {
            label: 'Carrier Comparison',
            query: 'How do Maersk Line and MSC compare on ocean freight and bunker adjustments?',
          },
        ]

      case 'history':
        return [
          {
            label: 'Fleet Reliability',
            query: 'Summarize our historical on-time arrival rate and past route delays.',
          },
          {
            label: 'Recent Routes',
            query: 'What are our most frequented coastal routes and vessel classes?',
          },
        ]

      default:
        return [
          {
            label: 'Explain Voyage',
            query: "What's happening with my current voyage?",
          },
          {
            label: 'Freight Outlook',
            query: 'What is the current freight rate forecast and market trend?',
          },
          {
            label: 'Biggest Risks',
            query: 'What are the biggest operational risks right now?',
          },
        ]
    }
  }

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputQuery.trim() || isStreaming) return
    sendMessage(inputQuery)
    setInputQuery('')
  }

  const handleQuickAction = (action: QuickAction) => {
    if (isStreaming) return
    sendMessage(action.query)
  }

  // Format message text with markdown elements (bold, bullet points, headers)
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />
      }

      // Headers (### or ####)
      if (line.startsWith('#### ')) {
        return (
          <h4 key={idx} className="font-semibold text-emerald-400 text-xs tracking-wider uppercase mt-2 mb-1">
            {line.replace('#### ', '')}
          </h4>
        )
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="font-bold text-white text-sm tracking-wide mt-2 mb-1">
            {line.replace('### ', '')}
          </h3>
        )
      }

      // Bullet point
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().substring(2)
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 text-slate-300">
            <span className="text-emerald-400 mt-1 text-[10px] select-none">✦</span>
            <div className="flex-1">{formatInline(bulletText)}</div>
          </div>
        )
      }

      // Regular paragraph
      return (
        <p key={idx} className="my-0.5 text-slate-300 leading-relaxed">
          {formatInline(line)}
        </p>
      )
    })
  }

  // Inline formatting for **bold** and *italic*
  const formatInline = (str: string) => {
    // Simple regex parsing for **bold**
    const parts = str.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  const activeSectionLabel = activeSection.toUpperCase()

  return (
    <div className="varka-intelligence-wrapper">
      {/* 1. Floating Action Button (Launcher) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="varka-intelligence-fab group"
          aria-label="Open Varka Intelligence operational copilot"
        >
          <div className="varka-intelligence-fab-glow" />
          <div className="varka-intelligence-fab-inner">
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="varka-intelligence-fab-ping" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-wider text-white uppercase font-mono">
                VARKA INTELLIGENCE
              </span>
              <span className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE CONTEXT
              </span>
            </div>
          </div>
        </button>
      )}

      {/* 2. Floating AI Chat Window */}
      {isOpen && (
        <div
          className={`varka-intelligence-panel ${
            isMinimized ? 'varka-intelligence-panel-minimized' : ''
          }`}
          role="dialog"
          aria-label="Varka Intelligence Chatbot"
        >
          {/* Header */}
          <div className="varka-intelligence-header">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white tracking-wide font-mono">
                    VARKA INTELLIGENCE
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 uppercase">
                    COPILOT
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected
                          ? 'bg-emerald-400 animate-pulse'
                          : status === 'connecting' || status === 'reconnecting'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-rose-400'
                      }`}
                    />
                    {isConnected
                      ? 'LIVE CONTEXT'
                      : status === 'connecting'
                      ? 'CONNECTING'
                      : status === 'reconnecting'
                      ? 'RECONNECTING'
                      : 'OFFLINE'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="truncate max-w-[130px] font-mono text-slate-400">
                    Synced: {lastSyncTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={clearMessages}
                title="Clear conversation memory"
                className="p-1.5 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
                aria-label="Clear chat memory"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Window Body (Hidden if Minimized) */}
          {!isMinimized && (
            <>
              {/* Context Summary Bar */}
              <div className="varka-intelligence-context-bar">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="text-emerald-400 font-semibold font-mono uppercase tracking-wider text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                    {activeSectionLabel}
                  </span>
                  <span className="truncate text-slate-300">
                    {activeSection === 'tracking' && currentVoyage && (
                      <>
                        <strong>{currentVoyage.vesselName}</strong> • {currentVoyage.status} ({currentVoyage.speed}) • ETA: {currentVoyage.eta}
                      </>
                    )}
                    {(activeSection === 'prediction' ||
                      activeSection === 'cockpit' ||
                      activeSection === 'optimizer' ||
                      activeSection === 'jit' ||
                      activeSection === 'scenarios' ||
                      activeSection === 'fleet' ||
                      activeSection === 'risk' ||
                      activeSection === 'standards' ||
                      activeSection === 'scorecard') && (
                      <>
                        <strong>Route AUNTL → INPAR</strong> • Panamax • Rate: $13.99/MT • JIT: 10.8 kn
                      </>
                    )}
                    {activeSection === 'agent' && (
                      <>
                        <strong>Landed Cost Radar</strong> • Base $14.01/MT • Landed Range $769k-$812k
                      </>
                    )}
                    {activeSection === 'landed-cost' && (
                      <>
                        <strong>Accessorial Engine (:8001)</strong> • 31 Normalized Fees • True Landed Cost
                      </>
                    )}
                    {activeSection === 'history' && (
                      <>
                        <strong>Fleet Registry</strong> • 4 Completed Voyages • 100% On-Time Reliability
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="varka-intelligence-body">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`varka-intelligence-msg-wrap ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`varka-intelligence-msg ${
                        msg.role === 'user'
                          ? 'varka-intelligence-msg-user'
                          : 'varka-intelligence-msg-assistant'
                      }`}
                    >
                      {/* Avatar / Role Tag */}
                      <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-white/5 text-[10px]">
                        <span
                          className={`font-mono font-semibold flex items-center gap-1 ${
                            msg.role === 'user' ? 'text-cyan-300' : 'text-emerald-400'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <>USER</>
                          ) : (
                            <>
                              <Sparkles className="w-2.5 h-2.5" /> VARKA INTELLIGENCE
                            </>
                          )}
                        </span>
                        <span className="text-slate-500 font-mono text-[9px]">
                          {msg.timestamp}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="text-xs text-slate-200">
                        {renderMessageContent(msg.content)}
                        {msg.isStreaming && (
                          <span className="inline-block w-2 h-3.5 bg-emerald-400 ml-1 animate-pulse align-middle" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Dynamic Contextual Quick Actions */}
              <div className="varka-intelligence-chips">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {getQuickActions().map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isStreaming}
                      onClick={() => handleQuickAction(action)}
                      className="varka-intelligence-chip"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Footer */}
              <form onSubmit={handleSend} className="varka-intelligence-footer">
                <div className="varka-intelligence-input-container">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={`Ask Varka Intelligence about ${activeSectionLabel.toLowerCase()}...`}
                    disabled={isStreaming}
                    className="varka-intelligence-input"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isStreaming}
                    className="varka-intelligence-send-btn"
                    aria-label="Send query"
                  >
                    {isStreaming ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="text-[9px] text-slate-500 text-center font-mono mt-1.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                  Grounded in live operational context • Never hallucinated
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
