# EstateIQ

**My live website:** https://estateiq-rho-ten.vercel.app

I chose the tagline **“Find a place for your next chapter.”**

I built EstateIQ as a full-stack real estate platform for India, following the four core modules in the Sapphire IQ RealEstate Platform guide. I used React 19, TypeScript, React Router and Tailwind CSS for the frontend, and Express 5, Mongoose, JWT, bcrypt, Nodemailer, Multer and ImageKit for the backend.

I deployed the frontend and Express API together on Vercel. I connected MongoDB Atlas, ImageKit and Gmail SMTP through private environment settings. I added 18 illustrative homes with three photos each, and enabled accounts, owner dashboards and property management. I also added a labelled, read-only sample catalog for database startup failures, with a connection retry after 30 seconds.

I have not implemented the optional AI Property Hub.

## How I run a local demo

I use Node.js 24 and npm 11. From the repository root, I install the dependencies with:

```sh
npm ci
```

For a new local checkout, I copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`. I then start both apps with:

```sh
npm run dev
```

I open **http://127.0.0.1:5173**. My example environment files enable local demo mode. I can register a local account or use the demonstration owner I seeded:

- Email: `demo@estateiq.local`
- Password: `ExploreEstate2026!`

I use this public sample account only for local demonstrations. I prevent production from starting in demo mode or seeding this account. I store demo records in ignored `backend/data/estateiq.json`, local uploads in ignored `backend/uploads/`, and demo emails in ignored `backend/data/outbox/`. I can open a reset message in that outbox to follow its link; I do not deliver emails in demo mode.

If I leave the local JWT secret unset, I generate a temporary signing secret at startup, which invalidates those local sessions after a restart. My configured working copy now uses `DEMO_MODE=false` with Atlas and ImageKit; I explicitly switch it to `true` when I want an isolated demo.

## What I implemented

- I added registration, login, current-user lookup, session revocation on logout, and password reset with hashed, expiring, single-use tokens.
- I added property creation, editing and removal with API ownership checks, up to four images, image removal and a selectable gallery.
- I added keyword/location search, sale/rent, type, price, area and bedroom filters, sorting and pagination. I run filtering and pagination in MongoDB when connected.
- I added guest and authenticated viewing requests, private guest management links, cancellation, owner confirmation and active-slot conflict protection.
- I built dashboard tabs for listings, personal viewings and incoming requests, with pending and upcoming counts.
- I added responsive layouts, lazy routes, validation, loading/empty/error states, Helmet, CORS rules, origin checks and rate limiting.
- I added SEO metadata, canonical URLs, robots, a database sitemap, deep links and Vercel/Render configuration. My combined Express hosting option also injects property metadata into the initial HTML.

I configured one-hour viewing slots from 9am to 6pm **IST**, between one hour and 90 days ahead. I keep a request pending until its owner confirms it. I have not added payments or property transaction processing.

## How I check my work

```sh
npm test
npm run check
npm run build
npm run test:browser
npm run test:mongo
npm audit
```

I use `npm test` for the API, catalog, seeding and serverless adapter checks. I use `npm run check` for strict frontend TypeScript and `npm run build` for SEO files and production bundles. My local booking browser test requires `DEMO_MODE=true` and a running local server; I added a guard so it cannot submit test bookings through live email services.

I use an isolated MongoDB process for `npm run test:mongo`, without Atlas credentials. Its first run downloads a MongoDB binary, or I can supply an installed `mongod` through `MONGOMS_SYSTEM_BINARY`. I use installed Chrome by default for browser checks, with `BROWSER_CHANNEL` or `BROWSER_EXECUTABLE` available for another Chromium installation.

I verified the production build, TypeScript, 24 local API/catalog tests and responsive browser flows. My dependency audit reported zero known vulnerabilities at the time of the check. After stopping a slow local database download, I verified the real Mongoose adapter's 18-test API suite on [GitHub Actions](https://github.com/orpheusdark/real_eastate/actions/runs/41393536949).

I also verified Atlas connectivity and Gmail SMTP authentication. On the live Vercel site, I checked registration, session persistence after refresh, login/logout, listing creation and four real ImageKit uploads. I removed my temporary test records and images afterward. I chose to skip sending email, so I have not verified production email delivery or live viewing submission.

## How I manage configuration

I documented my service settings and deployment options in [deployment and service setup](docs/deployment.md). I keep secrets in backend environment settings and use `VITE_` variables only for public values. I exclude `.env` files, private keys, reset links, local uploads and email messages from Git.

- [My API reference](docs/api.md)
- [My requirements and architecture](docs/requirements.md)
- [My validation record](docs/validation.md)
- [My development journal](docs/development-log.md)
- [My image credits](docs/image-credits.md)

![My EstateIQ desktop home page](docs/screenshots/home-desktop.png)
