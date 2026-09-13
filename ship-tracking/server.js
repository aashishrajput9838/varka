require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');

const PORT = process.env.PORT || 3001;
const AISSTREAM_API_KEY = process.env.AISSTREAM_API_KEY || 'a15a7c25edeefff7b1028f7dbb17e5ab5ff9f9af';
const AISSTREAM_URL = 'wss://stream.aisstream.io/v0/stream';

// Miami-ish default bounding box (kept from the original spec) — edit to your area of interest.
const BOUNDING_BOXES = [[[25.835, -80.208], [25.603, -79.879]]];

const HISTORY_LIMIT = 100;
const STALE_MS = 15 * 60 * 1000; // 15 minutes
const PURGE_INTERVAL_MS = 60 * 1000; // sweep every minute

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------------------------------------------------------------------------
// In-memory vessel state
// ---------------------------------------------------------------------------
const vessels = new Map(); // mmsi -> vessel record

function upsertVessel(mmsi, patch) {
  const existing = vessels.get(mmsi) || {
    mmsi,
    shipName: null,
    latitude: null,
    longitude: null,
    speed: null,
    course: null,
    trueHeading: null,
    lastSeen: null,
    history: [],
  };

  const updated = { ...existing, ...patch, lastSeen: Date.now() };

  if (
    typeof patch.latitude === 'number' &&
    typeof patch.longitude === 'number'
  ) {
    const last = existing.history[existing.history.length - 1];
    const point = [patch.latitude, patch.longitude];
    if (!last || last[0] !== point[0] || last[1] !== point[1]) {
      updated.history = [...existing.history, point].slice(-HISTORY_LIMIT);
    }
  }

  vessels.set(mmsi, updated);
}

function purgeStaleVessels() {
  const now = Date.now();
  for (const [mmsi, v] of vessels.entries()) {
    if (now - v.lastSeen > STALE_MS) {
      vessels.delete(mmsi);
    }
  }
}
setInterval(purgeStaleVessels, PURGE_INTERVAL_MS);

// ---------------------------------------------------------------------------
// AISStream WebSocket client with auto-reconnect + backoff
// ---------------------------------------------------------------------------
let ws = null;
let wsStatus = 'disconnected'; // disconnected | connecting | connected | error
let reconnectAttempts = 0;
const MAX_BACKOFF_MS = 30_000;

function connectAisStream() {
  if (!AISSTREAM_API_KEY || AISSTREAM_API_KEY === 'PASTE_YOUR_AISSTREAM_API_KEY_HERE') {
    wsStatus = 'error';
    console.warn(
      '[AISStream] No API key configured. Edit backend/.env and set AISSTREAM_API_KEY, then restart the server.'
    );
    return;
  }

  wsStatus = 'connecting';
  ws = new WebSocket(AISSTREAM_URL, { perMessageDeflate: true });

  let subscribed = false;

  ws.on('open', () => {
    wsStatus = 'connected';
    reconnectAttempts = 0;
    console.log('[AISStream] Connected. Sending subscription...');

    // Dispatch subscription within 3 seconds of open, as required by AISStream.
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const subscriptionMessage = {
          APIKey: AISSTREAM_API_KEY,
          BoundingBoxes: BOUNDING_BOXES,
          FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
        };
        ws.send(JSON.stringify(subscriptionMessage));
        subscribed = true;
        console.log('[AISStream] Subscription sent.');
      }
    }, 1000);
  });

  ws.on('message', (data, isBinary) => {
    try {
      // Decode incoming frames (binary or text) into UTF-8 before parsing JSON.
      const text = isBinary ? Buffer.from(data).toString('utf8') : data.toString('utf8');
      const msg = JSON.parse(text);
      handleAisMessage(msg);
    } catch (err) {
      console.error('[AISStream] Failed to parse message:', err.message);
    }
  });

  ws.on('close', (code, reason) => {
    wsStatus = 'disconnected';
    console.warn(`[AISStream] Connection closed (code=${code}). Reconnecting...`);
    scheduleReconnect();
  });

  ws.on('error', (err) => {
    wsStatus = 'error';
    console.error('[AISStream] WebSocket error:', err.message);
    // 'close' will typically fire after 'error'; reconnect is scheduled there.
  });
}

function scheduleReconnect() {
  reconnectAttempts += 1;
  const delay = Math.min(1000 * 2 ** reconnectAttempts, MAX_BACKOFF_MS);
  console.log(`[AISStream] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})`);
  setTimeout(connectAisStream, delay);
}

function handleAisMessage(msg) {
  const mmsi =
    msg?.MetaData?.MMSI ?? msg?.Message?.PositionReport?.UserID ?? msg?.Message?.ShipStaticData?.UserID;
  if (mmsi === undefined || mmsi === null) return;

  const shipNameRaw = msg?.MetaData?.ShipName;
  const shipName = shipNameRaw ? shipNameRaw.trim() : undefined;

  if (msg.MessageType === 'PositionReport') {
    const pr = msg.Message.PositionReport;
    upsertVessel(mmsi, {
      ...(shipName ? { shipName } : {}),
      latitude: pr.Latitude,
      longitude: pr.Longitude,
      speed: pr.Sog,
      course: pr.Cog,
      trueHeading: pr.TrueHeading,
    });
  } else if (msg.MessageType === 'ShipStaticData') {
    const sd = msg.Message.ShipStaticData;
    upsertVessel(mmsi, {
      shipName: shipName || sd?.ShipName?.trim(),
    });
  }
}

connectAisStream();

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------
app.get('/api/ships', (req, res) => {
  const data = Array.from(vessels.values());
  res.json({ count: data.length, data });
});

app.get('/api/ships/:mmsi', (req, res) => {
  const vessel = vessels.get(Number(req.params.mmsi)) || vessels.get(req.params.mmsi);
  if (!vessel) {
    return res.status(404).json({ error: `No vessel found for MMSI ${req.params.mmsi}` });
  }
  res.json(vessel);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    trackedVessels: vessels.size,
    aisStreamStatus: wsStatus,
  });
});

function startServer(portToTry) {
  const server = app.listen(portToTry, '0.0.0.0', () => {
    console.log(`Ship tracker live server listening on port ${portToTry}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(portToTry) === 3000 ? 3001 : Number(portToTry) + 1;
      console.warn(`[Port Notice] Port ${portToTry} is occupied (by Varka dashboard). Automatically switching to http://localhost:${nextPort}`);
      startServer(nextPort);
    } else {
      console.error('Server listen error:', err);
    }
  });
}

startServer(PORT);