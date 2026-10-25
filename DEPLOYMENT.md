# Neel Solutions deployment

The repository is a Node.js monorepo: the Next.js storefront and Express API run as one GoDaddy Node.js app. The root `npm run build` builds all workspaces and generates Prisma Client; `npm start` starts both services. Browser API calls use the same-origin `/api` proxy, so they do not point at the visitor's `localhost`.

## Airo Preview / Deployment

Deploy the repository root, not just `apps/web`. Use `npm ci` to install, `npm run build` to build both workspaces, and `npm start` as the start command. The root start script launches the web app and API together; the web app proxies `/api` requests to the API on port 5000. Starting only the web workspace leaves product, settings, and authentication API requests unavailable.

Configure these values in Airo's server environment before building:

- `DATABASE_URL` and a unique `JWT_SECRET` of at least 32 characters.
- `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` with the same Google Identity Services Web client ID. The `NEXT_PUBLIC_` value is compiled into the web bundle, so rebuild after changing it. Add the actual preview and production site origins (scheme and hostname, without a path) to the OAuth client's authorized JavaScript origins.
- `WEB_ORIGIN` set to the site's HTTPS origin. `API_INTERNAL_URL` is not needed when both apps run with the root start command; the script points the web proxy to the local API process.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` if the production database needs the admin account created or updated. Run `npm run db:deploy` and `npm run db:seed` from the repository root only when intended; seeding resets that account's password.

Check `https://<site-origin>/api/v1/health` after startup. It must return a JSON response from this app, with `database: connected` for a healthy database. If Airo requires separate web and API services, deploy the API workspace as a Node service and set the web service's `API_INTERNAL_URL` to the API's reachable origin; do not leave it pointing at `127.0.0.1` unless both processes share the same host. The `NEXT_PUBLIC_API_URL` setting should remain empty when using the same-origin proxy.

Troubleshooting: an HTML or plain-text `500`/`502` response from `/api/v1/health` means the request is not reaching the Express API; fix the API service/start command or the web-to-API proxy before changing database data. A JSON `503` response with `database: unavailable` means Express is running but cannot query its configured database; verify `DATABASE_URL` is set in the API runtime, that the database allows connections from that host, and that `npm run db:deploy` completed. Do not run the seed to fix a connection error. Once health returns JSON with `database: connected`, check `/api/v1/products` returns the catalog and log in using the admin credentials configured for that database.

The database on the preview is separate from a local database. Seeding supplies starter products but does not transfer locally uploaded product images, branding, or your catalog; import those records or upload them in Admin after the API and admin account are working.

## GoDaddy Node.js Hosting

Use GoDaddy Node.js Hosting or a Linux VPS. The hosting plan must support a Node.js app, and the production database must be reachable from it. GoDaddy requires root `build` and `start` scripts. Confirm the Node.js runtime supported by the purchased plan before publishing because the project currently declares Node.js 22+. See GoDaddy's [Node.js app requirements](https://developer.godaddy.com/en/docs/api-users/hosting/app-requirements).

1. Confirm the GoDaddy account has Node.js Hosting enabled and an eligible active Web Hosting plan/app slot for publishing.
2. Create the managed MySQL database and keep its host, database name, username and password private.
3. Import the project root through GitHub or a ZIP. Include source, workspace manifests, lockfile, migrations and public assets; exclude `node_modules`, `.next`, `dist` and `.env`.
4. Set these secrets/environment values in GoDaddy before building:
   - `DATABASE_URL`: GoDaddy MySQL connection URL (URL-encode special characters in the password).
   - `JWT_SECRET`: unique random value of at least 32 characters.
   - `WEB_ORIGIN`: the exact HTTPS storefront origin, e.g. `https://www.example.com`.
   - `NEXT_PUBLIC_API_URL`: leave empty for the same-origin API proxy. This value is compiled into the web bundle, so configure it before the build.
   - `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: the same Google Identity Services Web OAuth client ID. Add the storefront origins to its authorized JavaScript origins in Google Cloud. The ID-token sign-in flow does not need the OAuth client secret.
   - Do not upload `.env` files or put secrets in source control. Configure production values directly in the host's environment-variable settings.
   - WhatsApp status updates use Meta's official Cloud API. Set `WHATSAPP_ACCESS_TOKEN` (permanent System User token), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_TEMPLATE_DISPATCHED`, `WHATSAPP_TEMPLATE_OUT_FOR_DELIVERY`, `WHATSAPP_TEMPLATE_DELIVERED`, and `WHATSAPP_TEMPLATE_LANGUAGE=en` in the API environment. The customer opt-in is saved on each order. Only Dispatched, Out for Delivery, and Delivered are queued; a database worker retries send failures and delivery receipts are saved against each order.
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: unique production admin credentials, at least 12 password characters, if seeding the production DB.
5. Deploy a private preview first. From the project root, run `npm run db:deploy`, then set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (at least 12 characters) and run `npm run db:seed`. This creates/updates the admin account and seeds starter products, category, shipping zone, PINs and coupon. Running it resets that admin account's password to `ADMIN_PASSWORD`; do not run it unless you intend that. Starter products do not include your local uploaded images or branding; upload them through Admin after sign-in, or migrate those records from the local database.
6. Verify `/api/v1/health` reports `database: connected`; test admin login, product images, coupon validation, serviceable PINs and a COD order in preview.
7. In Meta Webhooks, use callback URL `https://your-domain/webhook`, the same `WHATSAPP_VERIFY_TOKEN`, and subscribe to the WhatsApp `messages` field. The webhook signature is checked with `WHATSAPP_APP_SECRET`.
8. Publish and connect the domain/SSL after preview passes. Live WhatsApp delivery also requires the three approved Utility templates and a permanent Meta token.

### Images and branding

Admin → Store branding and product management accept PNG, JPEG, or WebP uploads up to 5 MB per image, or image URLs/site-relative paths. Uploaded image data is stored in MySQL. The API accepts JSON payloads up to 45 MB so all six homepage slides can be saved together.

## VPS / PM2

1. Install Node.js 22+, MySQL 8+, and PM2.
2. Install the root workspaces with `npm ci`.
3. Configure environment variables in the hosting control panel, including a production database URL, strong `JWT_SECRET`, and `WEB_ORIGIN`. `.env.example` documents the root/local variables; `apps/api/.env.example` documents API-only and WhatsApp variables. These templates contain placeholders, not credentials.
4. Run `npm run db:deploy`, then `npm run build`.
5. Start both apps with `pm2 start ecosystem.config.js` and `pm2 save`.
6. Configure Nginx to proxy HTTPS traffic to the web process on port 3000. Keep API port 5000 private behind the Next.js `/api` rewrite.

## Local development

```bash
npm ci
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run dev
```

Web: `http://localhost:3000` · API: `http://localhost:5000` · Admin: `http://localhost:3000/admin`.

## Production checklist

- Replace all development credentials and secrets; keep `.env` out of Git and ZIP uploads.
- Set `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN` and the GoDaddy production admin credentials in the host dashboard.
- Apply migrations before starting the new build; verify `/api/v1/health` says `database: connected`.
- Add the actual serviceable PIN codes/shipping zone rows to MySQL before accepting orders. The seed PINs are development examples only.
- Payment is COD only until a payment provider is integrated and its keys/webhooks are configured.
- Orders can be status-updated for manual tracking. This code does not integrate a courier, live tracking number, transactional email/SMS, tax calculation, or online payment yet.
