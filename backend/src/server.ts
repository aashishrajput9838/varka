import "dotenv/config";
import app from "./app.js";
import connectMongoDB from "./db/mongodb/connection.js";
import config from "./config/index.js";
import { initVarkaIntelligenceWs } from "./websocket/varkaIntelligence.ws.js";
// Reloaded with active Gemini API integration

const startServer = async () => {
  try {
    await connectMongoDB();
    const server = app.listen(config.port, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 VARKA Backend Server running at http://localhost:${config.port}`);
      console.log(`📡 API Base URL: http://localhost:${config.port}/api/v1/user`);
      console.log(`🤖 VARKA INTELLIGENCE WebSocket: ws://localhost:${config.port}/ws/varka-intelligence`);
      console.log(`==================================================\n`);
    });

    initVarkaIntelligenceWs(server);

    const shutdown = () => {
      console.log("\nShutting down server gracefully...");
      server.close(() => {
        console.log("Server stopped.");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;