import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwtService from '../services/jwt.js';
import userModel from '../db/mongodb/user/user.model.js';
import { VarkaContextService, VarkaOperationalContext } from '../services/varkaContext.service.js';
import { GeminiService } from '../services/gemini.service.js';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  userEmail?: string;
  userName?: string;
  isAlive?: boolean;
  isStreaming?: boolean;
}

export const initVarkaIntelligenceWs = (server: http.Server) => {
  const wss = new WebSocketServer({ noServer: true });

  // Handle HTTP Upgrade with strict path matching
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    if (url.pathname !== '/ws/varka-intelligence') {
      return; // allow other upgrade handlers or 404
    }

    // Extract access token from query param, cookies, or auth header
    let token: string | undefined;

    const tokenParam = url.searchParams.get('token');
    if (tokenParam) {
      token = tokenParam;
    } else if (request.headers.cookie) {
      const match = request.headers.cookie.match(/accessToken=([^;]+)/);
      if (match) token = match[1];
    } else if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
      token = request.headers.authorization.split(' ')[1];
    }

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const decoded = jwtService.verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      const authWs = ws as AuthenticatedSocket;
      authWs.userId = decoded.userId;
      wss.emit('connection', authWs, request);
    });
  });

  // Client connection handler
  wss.on('connection', async (ws: AuthenticatedSocket) => {
    const userId = ws.userId;
    if (!userId) {
      ws.close(4401, 'Unauthorized');
      return;
    }

    ws.isAlive = true;
    ws.isStreaming = false;

    // Fetch user details for richer context
    let userName = 'Charterer';
    let userEmail = 'charterer@varka.ai';
    try {
      const user = await userModel.findById(userId).lean();
      if (user) {
        userName = (user as any).name || (user as any).username || userName;
        userEmail = (user as any).email || userEmail;
      }
    } catch {
      // Fallback if DB lookup fails
    }

    ws.userName = userName;
    ws.userEmail = userEmail;

    // Initialize or fetch operational context
    const currentContext = VarkaContextService.getContext({
      id: userId,
      name: userName,
      email: userEmail,
    });

    // Send connection success payload
    const sendJson = (data: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    };

    sendJson({
      type: 'connected',
      userId,
      contextVersion: currentContext.lastUpdated,
      message: 'Connected to VARKA INTELLIGENCE reasoning core.',
    });

    // Keepalive ping-pong
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Incoming messages
    ws.on('message', async (raw: Buffer | string) => {
      try {
        const rawStr = raw.toString();
        // Security: Prevent giant payloads
        if (rawStr.length > 32768) {
          sendJson({ type: 'error', message: 'Message payload too large (max 32KB).' });
          return;
        }

        const data = JSON.parse(rawStr);

        // 1. Ping
        if (data.type === 'ping') {
          sendJson({ type: 'pong', timestamp: Date.now() });
          return;
        }

        // 2. Clear conversation history
        if (data.type === 'clear') {
          GeminiService.clearHistory(userId);
          sendJson({ type: 'cleared', message: 'Session conversation memory cleared.' });
          return;
        }

        // 3. Live Context Sync from Frontend (e.g. user selected different vessel, tab changed)
        if (data.type === 'context.sync' && data.context) {
          const updated = VarkaContextService.syncContext(userId, data.context);
          sendJson({
            type: 'context.synced',
            lastUpdated: updated.lastUpdated,
            currentPage: updated.currentPage,
          });
          return;
        }

        // 4. Live Context Partial Field Update
        if (data.type === 'context.update' && data.path) {
          const updated = VarkaContextService.updateField(
            userId,
            data.path,
            data.value,
            data.source || 'Dashboard Interaction'
          );
          sendJson({
            type: 'context.synced',
            lastUpdated: updated.lastUpdated,
            path: data.path,
          });
          return;
        }

        // 5. Chat Query from User
        if (data.type === 'chat') {
          const query = typeof data.message === 'string' ? data.message.trim() : '';
          if (!query) {
            sendJson({ type: 'error', message: 'Message content cannot be empty.' });
            return;
          }

          if (ws.isStreaming) {
            sendJson({
              type: 'error',
              message: 'A reasoning stream is already active. Please wait for completion.',
            });
            return;
          }

          ws.isStreaming = true;
          sendJson({ type: 'stream.start' });

          try {
            const ctx = VarkaContextService.getContext({
              id: userId,
              name: ws.userName ?? 'Charterer',
              email: ws.userEmail || 'charterer@varka.ai',
            });

            // If active tab or partial override was included in chat message, apply it first
            if (data.activeSection) {
              ctx.currentPage = data.activeSection;
            }

            await GeminiService.streamChat(userId, query, ctx, (token) => {
              sendJson({
                type: 'token',
                content: token,
              });
            });

            sendJson({ type: 'complete' });
          } catch (streamErr: any) {
            console.error('Error during Varka Intelligence streaming:', streamErr);
            sendJson({
              type: 'error',
              message:
                'Varka Intelligence is temporarily unable to reach its reasoning service. Your operational dashboard is still available.',
            });
          } finally {
            ws.isStreaming = false;
          }
          return;
        }

        // Unknown message type
        sendJson({ type: 'warning', message: `Unrecognized message type: ${data.type}` });
      } catch (err: any) {
        console.error('Failed to parse WebSocket message:', err);
        sendJson({ type: 'error', message: 'Malformed JSON payload.' });
      }
    });

    ws.on('close', () => {
      ws.isAlive = false;
    });

    ws.on('error', (err) => {
      console.error('WebSocket connection error:', err);
    });
  });

  // Heartbeat interval to prune dead sockets
  const interval = setInterval(() => {
    wss.clients.forEach((wsClient) => {
      const client = wsClient as AuthenticatedSocket;
      if (client.isAlive === false) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
};
