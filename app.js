// Entry point for GoDaddy cPanel Node.js Selector / Phusion Passenger / PM2
if (process.env.DB_HOST) {
  const { DB_HOST, DB_PORT = '3306', DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  process.env.DATABASE_URL =
    'mysql://' + encodeURIComponent(DB_USER) + ':' + encodeURIComponent(DB_PASSWORD) +
    '@' + DB_HOST + ':' + DB_PORT + '/' + DB_NAME;
}

require('./scripts/start.js');
