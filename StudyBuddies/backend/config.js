const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(envPath);

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return value;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function parseNumber(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const emailProvider = getEnv(
  "EMAIL_PROVIDER",
  getEnv("MAILTRAP_API_TOKEN", getEnv("MAILTRAP_TOKEN", null)) ? "mailtrap-api" : "smtp",
);

const emailUser = getEnv("MAILTRAP_USER", getEnv("SMTP_USER", getEnv("EMAIL_USER")));
const emailPass = getEnv("MAILTRAP_PASS", getEnv("SMTP_PASS", getEnv("EMAIL_PASS")));
const smtpHost = getEnv("MAILTRAP_HOST", getEnv("SMTP_HOST"));
const smtpPort = parseNumber(getEnv("MAILTRAP_PORT", getEnv("SMTP_PORT")), 2525);
const smtpSecure = parseBoolean(getEnv("MAILTRAP_SECURE", getEnv("SMTP_SECURE")), false);
const emailFrom = getEnv(
  "EMAIL_FROM",
  getEnv("MAILTRAP_SENDER_EMAIL", emailUser),
);

const config = {
  mongodbUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET"),
  frontendUrl: requireEnv("FRONTEND_URL", "http://localhost:5173"),
  apiBaseUrl: requireEnv("API_BASE_URL", "http://localhost:5000"),
  emailProvider,
  emailService: getEnv("EMAIL_SERVICE", "gmail"),
  emailUser,
  emailPass,
  emailFrom: requireEnv("EMAIL_FROM", emailFrom),
  emailFromName: getEnv("EMAIL_FROM_NAME", "StudyBuddies"),
  smtpHost,
  smtpPort,
  smtpSecure,
  mailtrapApiToken: getEnv("MAILTRAP_API_TOKEN", getEnv("MAILTRAP_TOKEN")),
  port: Number(process.env.PORT || 5000),
};

module.exports = config;
