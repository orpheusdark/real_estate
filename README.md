# EstateIQ

**Live website:** https://estateiq-rho-ten.vercel.app

The frontend and Express API run together on Vercel, with MongoDB Atlas, ImageKit and Gmail SMTP configured through private production settings. The collection contains 18 illustrative homes, each with three photos. Accounts, owner dashboards and property management are enabled. If the database cannot initialize, the server provides a labelled, read-only sample catalog and retries the connection after 30 seconds.

**Find a place for your next chapter.** A full-stack real estate platform for India, implementing the four core modules in the Sapphire IQ RealEstate Platform guide.

React 19 + TypeScript + React Router + Tailwind CSS, with an Express 5 REST API, Mongoose, JWT, bcrypt, Nodemailer, Multer and ImageKit. The optional AI Property Hub is outside this core build and is not implemented.

## Run without external accounts

Use Node.js 24 and npm 11. From the repository root:

```sh
npm ci
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`, then:

```sh
npm run dev
```

Open **http://127.0.0.1:5173**. The examples explicitly enable local demo mode. You can register your own account, or use the seeded demonstration owner:

- Email: `demo@estateiq.local`
- Password: `ExploreEstate2026!`

This is a public sample account for local use only. Production refuses demo mode and never seeds it. Local data persists in ignored `backend/data/estateiq.json`; uploaded images are in ignored `backend/uploads/`; emails are JSON messages in ignored `backend/data/outbox/`. Open a reset email there to use its link. Emails are not delivered in demo mode. A temporary signing secret is generated if none is set, so local sessions expire when the API restarts.

## What works

- Register, login, current-user lookup, logout with session revocation, email reset flow with hashed, expiring, single-use reset tokens.
- Create, edit and remove your own properties; server-enforced ownership; up to four images, image removal, and a selectable gallery.
- Search by keyword or location; filter by sale/rent, type, price, area and bedrooms; sort and paginate. MongoDB performs filtering and pagination in connected mode.
- Guest and signed-in viewing requests, private guest management links, cancellation, owner confirmation, and conflict protection for active property/time slots.
- Dashboard tabs for your listings, your viewings and incoming requests, plus pending and upcoming counts.
- Responsive pages, lazy routes, input validation, error/empty/loading states, Helmet, CORS allowlist, origin checks and rate limiting.
- SEO metadata, canonical URLs, robots, sitemap, deep-link handling and Render/Vercel configuration. The combined server also sends property metadata in the initial HTML.

Viewings are one-hour slots starting on the hour from 9am to 6pm **IST**, at least one hour and at most 90 days ahead. A request is pending until its owner confirms it. EstateIQ does not take payments or complete property transactions.

## Checks

```sh
npm test                  # Full API, catalog, seeding and serverless adapter tests
npm run check             # Strict frontend TypeScript
npm run build             # SEO files, TypeScript and production bundles
npm run test:browser       # Chrome smoke flow; run npm run dev in another terminal first
npm run test:mongo         # Same API suite against an isolated MongoDB process
npm audit
```

The MongoDB command downloads a MongoDB binary on first use and needs network access. It does not use Atlas credentials. `MONGOMS_SYSTEM_BINARY` can point to an installed `mongod`. Browser checks use installed Chrome by default; set `BROWSER_CHANNEL` or `BROWSER_EXECUTABLE` for another Chromium installation. Browser checks create a local test account and remove their test listing when successful.

**Verified during this build:** production build, TypeScript, 24 local API/catalog tests, desktop/mobile browser flow, and dependency audit (zero known vulnerabilities). The local MongoDB binary download was stopped because it was too slow; the same 18-test suite subsequently passed against an isolated MongoDB instance on GitHub Actions. Atlas connectivity and Gmail SMTP authentication have since passed. The full Vercel site was tested in Chrome with registration, persisted cookie sessions, login/logout, listing creation and four real ImageKit uploads. Temporary test records and images were removed. Email delivery and live viewing submissions were skipped at the user’s request. The [GitHub validation run](https://github.com/orpheusdark/real_eastate/actions/runs/41393536949) passed the API, MongoDB, build and production audit steps.

## Configuration comes last

See [deployment and service setup](docs/deployment.md) for the remaining MongoDB Atlas, ImageKit, SMTP, JWT and hosting values. Keep secrets in backend environment settings. Only public API/site origins belong in `VITE_` variables. Never commit `.env` files, private keys, reset links, uploaded files or local email messages.

- [API reference](docs/api.md)
- [Requirements and architecture](docs/requirements.md)
- [Validation record](docs/validation.md)
- [Development journal](docs/development-log.md)
- [Image credits](docs/image-credits.md)

![EstateIQ desktop home](docs/screenshots/home-desktop.png)
