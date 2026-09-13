export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface VarkaChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface QuickAction {
  label: string;
  query: string;
  icon?: string;
}

export interface WsServerMessage {
  type: 'connected' | 'stream.start' | 'token' | 'complete' | 'error' | 'pong' | 'context.synced' | 'cleared' | 'warning';
  userId?: string;
  contextVersion?: string;
  content?: string;
  message?: string;
  timestamp?: number | string;
  path?: string;
}
