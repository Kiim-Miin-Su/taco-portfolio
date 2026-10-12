/** Public, synthetic demo values only. Never read .env files or inherit live provider credentials. */
for (const key of Object.keys(process.env)) {
  if (key.startsWith('TACO_ACCOUNT_ENC_KEY_')) { delete process.env[key]; }
}
const demoValues: Record<string, string> = {
  JWT_SECRET: 'portfolio-demo-access-only-2026',
  JWT_REFRESH_SECRET: 'portfolio-demo-refresh-only-2026',
  AUTH_CODE_SECRET: 'portfolio-demo-authcode-only-2026',
  TACO_PUBLIC_MEMORY_DEMO: 'true',
  TACO_INITIAL_PASSWORD: 'PortfolioDemo!2026',
  CORS_ORIGIN: 'https://portfolio.example.com',
  COOKIE_DOMAIN: '', COOKIE_CROSS_SITE: 'false', COOKIE_SAME_ORIGIN_PROXY: 'true',
  ENABLE_DOCS: 'false', LOG_LEVEL: 'error',
  STUDENT_PII_ENC_KEY: 'portfolio-demo-student-pii-only-2026',
  STUDENT_PII_KEY_VERSION: 'demo-v1',
  ZOOM_ENC_KEY: 'portfolio-demo-zoom-only-2026',
  TACO_ACCOUNT_ENC_KEY_VERSION: 'v1',
  TACO_ACCOUNT_ENC_KEY_V1: 'portfolio-demo-account-only-2026',
};
for (const [key, value] of Object.entries(demoValues)) { process.env[key] = value; }
for (const key of ['DATABASE_URL', 'TEST_DATABASE_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SENS_SERVICE_ID', 'SENS_ACCESS_KEY', 'SENS_SECRET_KEY', 'SENS_FROM', 'BLOB_READ_WRITE_TOKEN']) {
  delete process.env[key];
}
