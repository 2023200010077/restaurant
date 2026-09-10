import dotenv from "dotenv";

import app from "./app.js";

import {
  testDatabaseConnection,
} from "./config/database.js";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

async function startServer(): Promise<void> {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(
        `Backend server running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Unable to start the server:",
      error
    );

    process.exit(1);
  }
}

void startServer();