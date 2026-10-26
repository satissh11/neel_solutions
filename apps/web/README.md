# Web storefront

The customer storefront and administration pages are built with Next.js App Router.

## Run locally

From the monorepo root, install dependencies and start the workspace with `npm run dev`. The web app runs on Next.js; the API is a separate workspace. Configure local environment values from `apps/web/.env.example` and `apps/api/.env.example` as needed.

## Structure

- `src/app/` contains route pages and the shared root layout.
- `src/components/` contains reusable storefront, layout, and UI components.
- `src/context/` contains authentication, cart, and site settings providers.
- `src/lib/` and `src/types/` contain API helpers and shared frontend types.
- `public/` contains the brand logo and product/admin illustrations.

The root layout displays a short animated nature introduction before showing the requested page.
