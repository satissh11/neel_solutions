
/* Entry point for GoDaddy Node.js hosting */

// Build DATABASE_URL from DB_* variables only when DB_HOST is configured.
if (process.env.DB_HOST) {
  const {
    DB_HOST,
    DB_PORT = "3306",
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
  } = process.env;

  if (!DB_NAME || !DB_USER || !DB_PASSWORD) {
    throw new Error(
      "Database configuration incomplete: check DB_NAME, DB_USER and DB_PASSWORD."
    );
  }

  process.env.DATABASE_URL =
    "mysql://" +
    encodeURIComponent(DB_USER) +
    ":" +
    encodeURIComponent(DB_PASSWORD) +
    "@" +
    DB_HOST +
    ":" +
    DB_PORT +
    "/" +
    DB_NAME;
}

// Safe diagnostic BEFORE application startup; never log credentials.
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("[DB CHECK] DATABASE_URL is missing");
} else {
  try {
    const parsed = new URL(dbUrl);
    console.log("[DB CHECK]", {
      host: parsed.hostname,
      port: parsed.port,
      database: decodeURIComponent(parsed.pathname.slice(1)),
    });
  } catch {
    console.error("[DB CHECK] DATABASE_URL format is invalid");
  }
}

require("./scripts/start.js");
