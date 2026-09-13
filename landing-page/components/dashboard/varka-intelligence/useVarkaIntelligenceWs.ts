'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ConnectionStatus, VarkaChatMessage, WsServerMessage } from './types'
import { NavSection, VoyageData, UserProfileData } from '../types'

interface UseVarkaIntelligenceWsProps {
  activeSection: NavSection
  currentVoyage?: VoyageData
  currentUser?: UserProfileData | null
  enabled?: boolean
}

export function useVarkaIntelligenceWs({
  activeSection,
  currentVoyage,
  currentUser,
  enabled = true,
}: UseVarkaIntelligenceWsProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [messages, setMessages] = useState<VarkaChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        "**VARKA INTELLIGENCE** is online and synchronized with live platform telemetry. Ask me anything regarding your active voyage, 60-day freight outlook, vessel optimization, JIT slow-steaming, or landed demurrage risk.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [isStreaming, setIsStreaming] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const currentStreamingMsgIdRef = useRef<string | null>(null)

  // Derive WebSocket URL
  const getWsUrl = useCallback((): string | null => {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem('varka_token')
    if (!token) return null

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030'
    let wsBase = apiBase.replace(/^http/, 'ws')
    // Remove trailing slash if present
    wsBase = wsBase.replace(/\/$/, '')

    return `${wsBase}/ws/varka-intelligence?token=${encodeURIComponent(token)}`
  }, [])

  // Sync context with backend
  const syncLiveContext = useCallback((ws: WebSocket) => {
    if (ws.readyState !== WebSocket.OPEN) return

    const payload: any = {
      currentPage: activeSection,
      lastUpdated: new Date().toISOString(),
    }

    if (currentVoyage) {
      payload.voyage = {
        voyageId: currentVoyage.id,
        vesselName: currentVoyage.vesselName,
        imoNumber: currentVoyage.imoNumber,
        carrier: currentVoyage.carrier,
        originPort: currentVoyage.originPort,
        originCode: currentVoyage.originCode,
        destinationPort: currentVoyage.destinationPort,
        destinationCode: currentVoyage.destinationCode,
        departureDate: currentVoyage.departureDate,
        eta: currentVoyage.eta,
        status: currentVoyage.status,
        cargoType: currentVoyage.cargoType,
        volume: currentVoyage.volume,
        containerCount: currentVoyage.containerCount,
        riskLevel: currentVoyage.riskLevel,
        riskDetail: currentVoyage.riskDetail,
      }

      // Convert speed string (e.g. '14.6 kn') to numeric
      const speedNum = parseFloat(currentVoyage.speed) || 14.6
      const distNum = parseFloat(currentVoyage.distanceRemaining) || 420

      payload.tracking = {
        currentLocation: currentVoyage.currentLocation,
        coordinates: currentVoyage.coordinates,
        speedKnots: speedNum,
        heading: currentVoyage.heading,
        distanceRemainingNm: distNum,
        waypointsSummary: currentVoyage.waypoints.map((w) => `${w.name} (${w.status})`).join(' -> '),
      }
    }

    ws.send(
      JSON.stringify({
        type: 'context.sync',
        context: payload,
      })
    )
  }, [activeSection, currentVoyage])

  // Establish connection
  const connect = useCallback(() => {
    if (!enabled) return
    const url = getWsUrl()
    if (!url) {
      setStatus('disconnected')
      return
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    setStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting')

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        reconnectAttemptsRef.current = 0

        // Sync initial context immediately upon connection
        syncLiveContext(ws)

        // Start ping heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 25000)
      }

      ws.onmessage = (event) => {
        try {
          const data: WsServerMessage = JSON.parse(event.data)

          switch (data.type) {
            case 'connected':
              setLastSyncTime('Just now')
              break

            case 'context.synced':
              setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
              break

            case 'stream.start': {
              setIsStreaming(true)
              const newMsgId = `assistant-${Date.now()}`
              currentStreamingMsgIdRef.current = newMsgId
              setMessages((prev) => [
                ...prev,
                {
                  id: newMsgId,
                  role: 'assistant',
                  content: '',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isStreaming: true,
                },
              ])
              break
            }

            case 'token': {
              const token = data.content || ''
              const msgId = currentStreamingMsgIdRef.current
              if (msgId) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === msgId
                      ? { ...msg, content: msg.content + token, isStreaming: true }
                      : msg
                  )
                )
              }
              break
            }

            case 'complete': {
              setIsStreaming(false)
              const msgId = currentStreamingMsgIdRef.current
              if (msgId) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === msgId ? { ...msg, isStreaming: false } : msg
                  )
                )
              }
              currentStreamingMsgIdRef.current = null
              break
            }

            case 'error': {
              setIsStreaming(false)
              const errorText = data.message || 'Operational reasoning error.'
              setMessages((prev) => [
                ...prev,
                {
                  id: `err-${Date.now()}`,
                  role: 'assistant',
                  content: `⚠️ **Notice:** ${errorText}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
              currentStreamingMsgIdRef.current = null
              break
            }

            case 'cleared':
              setMessages([
                {
                  id: `welcome-${Date.now()}`,
                  role: 'assistant',
                  content:
                    'Conversation memory cleared. VARKA INTELLIGENCE is ready for new queries with live operational context.',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
              break

            default:
              break
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (err) => {
        console.warn('Varka Intelligence WebSocket error:', err)
      }

      ws.onclose = () => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
        setIsStreaming(false)
        wsRef.current = null

        // Attempt reconnection if enabled and within retry limit
        if (enabled && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
          reconnectAttemptsRef.current += 1
          setStatus('reconnecting')
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          setStatus('disconnected')
        }
      }
    } catch (err) {
      console.error('Failed to instantiate WebSocket:', err)
      setStatus('error')
    }
  }, [enabled, getWsUrl, syncLiveContext])

  // Sync context when dashboard state changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      syncLiveContext(wsRef.current)
    }
  }, [activeSection, currentVoyage, syncLiveContext])

  // Initial connection & cleanup
  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  // Send user message
  const sendMessage = useCallback(
    (text: string) => {
      const query = text.trim()
      if (!query || isStreaming) return

      // Optimistically append user message to UI
      const userMsg: VarkaChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, userMsg])

      // If socket is open, send payload
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'chat',
            message: query,
            activeSection,
          })
        )
      } else {
        // Not connected: inform user
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: 'assistant',
              content:
                '⚠️ Connection to Varka Intelligence reasoning service is currently interrupted. Attempting to reconnect...',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
          connect()
        }, 300)
      }
    },
    [isStreaming, activeSection, connect]
  )

  // Clear session history
  const clearMessages = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear' }))
    } else {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: 'Session history cleared. Ready for your operational queries.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }
  }, [])

  return {
    status,
    messages,
    isStreaming,
    lastSyncTime,
    sendMessage,
    clearMessages,
    reconnect: connect,
    isConnected: status === 'connected',
  }
}
