import "dotenv/config";
import app from "./app.js";
import connectMongoDB from "./db/mongodb/connection.js";
import config from "./config/index.js";

const startServer = async () => {
  try {
    await connectMongoDB();
    const server = app.listen(config.port, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 VARKA Backend Server running at http://localhost:${config.port}`);
      console.log(`📡 API Base URL: http://localhost:${config.port}/api/v1/user`);
      console.log(`==================================================\n`);
    });

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