# EstateIQ

[Live website](https://estateiq-rho-ten.vercel.app)

EstateIQ is a real estate website for browsing homes, posting listings and booking viewings. I built it for the Sapphire IQ full-stack project using React and TypeScript on the frontend, with Express and MongoDB on the backend.

The site runs on Vercel and includes 18 sample homes with three photos each. These are demonstration listings, so the photos and prices should not be treated as real property offers.

## Features

- Registration, login and password reset
- Property listings with owner-only edit and delete access
- Up to four photos per property, stored in ImageKit
- Filters for city, price, type, area, bedrooms and sale/rent
- Guest and registered-user viewing requests
- A dashboard for listings, appointments and incoming viewing requests
- Owner confirmation and appointment cancellation
- Responsive pages for mobile, tablet and desktop

The optional AI Property Hub is not included. There is no payment or property transaction system.

## Stack

React 19, TypeScript, React Router, Tailwind CSS, Express 5, Mongoose, JWT, bcrypt, Nodemailer, Multer and ImageKit.

## Run locally

Node.js 24 and npm 11 are used for this project.

```sh
npm ci
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`, then run:

```sh
npm run dev
```

Open http://127.0.0.1:5173.

The example files start the app in demo mode, so external accounts are not needed just to try it. For an Atlas connection and real uploads, fill in the service settings and set `DEMO_MODE=false`. Restart the API after changing the environment file.

### Demo account

```text
Email: demo@estateiq.local
Password: ExploreEstate2026!
```

This account is only seeded in local demo mode. Demo records go into `backend/data/estateiq.json`, images into `backend/uploads/`, and email messages into `backend/data/outbox/`. No emails are sent in this mode. These folders are excluded from Git.

If `JWT_SECRET` is empty in demo mode, the app generates a temporary secret. Restarting the API then signs out existing demo sessions.

## Checks

```sh
npm test
npm run check
npm run build
npm run test:mongo
npm audit
```

The API and catalog suite has 24 passing tests. The Mongoose API suite also passed against an isolated MongoDB instance on GitHub Actions.

For the local browser test, start the app with `DEMO_MODE=true`, then run:

```sh
npm run test:browser
```

This script refuses to run against connected services because it creates viewing requests. It uses installed Chrome by default. `BROWSER_CHANNEL` or `BROWSER_EXECUTABLE` can select another Chromium installation. The MongoDB test downloads a database binary on its first run; `MONGOMS_SYSTEM_BINARY` can point to an existing `mongod` instead.

I checked the deployed site in Chrome, including registration, login/logout, keeping a session after refresh, creating a listing and uploading four images to ImageKit. The temporary account, listing and images were removed afterward. Mobile, tablet and desktop layouts were also checked.

Gmail SMTP authentication works, but email delivery and live viewing submission have not been tested. No email was sent during setup.

## Deployment and notes

The frontend and API share the same Vercel origin. MongoDB Atlas stores the records, ImageKit stores uploaded photos, and Gmail SMTP is configured for email. Private values stay in environment settings, outside Git.

- [Setup and deployment](docs/deployment.md)
- [API reference](docs/api.md)
- [Requirements and architecture](docs/requirements.md)
- [Testing notes](docs/validation.md)
- [Development notes](docs/development-log.md)
- [Image credits](docs/image-credits.md)

![EstateIQ home page](docs/screenshots/home-desktop.png)
