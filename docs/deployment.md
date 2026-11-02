# Setup and deployment

[Live website](https://estateiq-rho-ten.vercel.app)

The frontend and Express API run in the same Vercel project, `estateiq`. MongoDB Atlas stores the records, ImageKit handles uploaded images and Gmail SMTP is configured for email. GitHub pushes trigger automatic deployments.

## Environment settings

Start from the environment examples in `backend` and `frontend`. Keep the completed `.env` files private; they are excluded from Git and deployment uploads.

| Variable                              | Value                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                            | `production` on the host                                                                         |
| `DEMO_MODE`                           | `false` on the host                                                                              |
| `MONGODB_URI`                         | Atlas connection string with a dedicated database and least-privilege database user              |
| `JWT_SECRET`                          | Random secret of at least 32 characters; use a different secret per environment                  |
| `FRONTEND_URL`                        | Exact HTTPS website origin, without trailing slash                                               |
| `PUBLIC_API_URL`                      | Exact HTTPS API origin, without trailing slash                                                   |
| `IMAGEKIT_PRIVATE_KEY`                | Private key, backend only                                                                        |
| `SMTP_HOST`, `SMTP_PORT`              | SMTP provider's SMTP host and port                                                               |
| `SMTP_SECURE`                         | `true` for implicit TLS, typically port 465; otherwise `false`, typically port 587 with STARTTLS |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Provider credentials and verified sender                                                         |
| `TRUST_PROXY`                         | `1` behind the trusted single Vercel/Render proxy; otherwise `0`                                 |
| `PORT`                                | Supplied by the hosting platform                                                                 |

`VITE_` variables are included in the browser build, so they must only contain public values. Database credentials, the JWT secret and service passwords belong on the backend.

Generate a signing secret locally:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Save the result privately. Changing the secret signs out existing sessions.

## MongoDB Atlas

Create a database user and allow the application to reach the cluster through the Atlas IP access list. The connection string must include the database user's password, URL-encoded where needed. Remove template brackets such as `<db_password>` after inserting the real value.

Mongoose creates the `users`, `properties` and `appointments` collections and initializes the unique email and active-viewing-slot indexes. Local JSON demo data is not automatically imported into Atlas.

During setup, I ran into both password formatting and network-access issues. The connection passed after correcting the string and updating the IP access list.

The 18 sample homes were added through `scripts/seed-live.mjs` under the configured university email's owner account. That account has a randomly generated initial password. Use Forgot password when ready to choose a password; no reset email was sent during setup.

## ImageKit

Set `IMAGEKIT_PRIVATE_KEY` from the ImageKit dashboard's API keys page. This server-side upload flow only needs the private key; it must not be added to the frontend environment.

Uploads go through Multer and Sharp before reaching ImageKit. Files are stored under `/estateiq/properties`. The editor accepts up to four photos, 4 MB each, and sends one file per request to stay below Vercel's 4.5 MB payload limit.

## Gmail

Use these server settings with a Google app password:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email-address
SMTP_PASS=your-app-password
SMTP_FROM="EstateIQ <your-email-address>"
```

An app password requires Google 2-Step Verification. Use the generated app password, not the normal Google account password.

SMTP authentication passed during setup. Email delivery, password-reset delivery and live viewing submission have not been tested because no email was sent.

## Running locally

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. With `DEMO_MODE=false`, the app uses Atlas, ImageKit and the configured SMTP service. For an isolated local demo, set `DEMO_MODE=true`. Demo emails are saved to `backend/data/outbox/` rather than sent.

Restart the API after editing environment settings. To check the database and SMTP connection without sending email:

```sh
npm run services:check
```

## Current Vercel configuration

| Setting                                           | Value                                 |
| ------------------------------------------------- | ------------------------------------- |
| Node.js                                           | 24                                    |
| Install command                                   | `npm ci`                              |
| Build command                                     | `npm run build`                       |
| Static output                                     | `frontend/dist`                       |
| API entry                                         | `api/server.js`                       |
| `LIVE_SERVICES`                                   | `true`                                |
| `DEMO_MODE`                                       | `false`                               |
| `VITE_API_URL`                                    | Empty, using relative `/api` requests |
| `FRONTEND_URL`, `PUBLIC_API_URL`, `VITE_SITE_URL` | `https://estateiq-rho-ten.vercel.app` |

Service credentials are stored as private Vercel settings. The API enforces production configuration and reuses its database connection across warm requests. Sharing one origin avoids cross-site authentication cookie issues.

Vercel adds wildcard routing fields to requests. These are removed before application filters are validated. The static sitemap is removed from the Vercel build output so `/sitemap.xml` reaches the API and uses actual database listing IDs.

If the live app cannot initialize, the function serves a labelled sample catalog and retries after 30 seconds. Account, listing and booking writes are blocked during fallback. `LIVE_SERVICES=false` can be used for an intentional browsing-only deployment.

## Other hosting options

`render.yaml` is included as an alternative, but there is no EstateIQ Render deployment.

For one Render service, use the repository root, build with `npm ci && npm run build`, start with `npm start`, and set `/api/health` as the health check. Point the frontend/API origin settings to that service and leave `VITE_API_URL` empty. This Express hosting option also injects property metadata into the initial HTML.

For a Vercel frontend with a separate Render API, set `VITE_API_URL` to the API origin and Render's `FRONTEND_URL` to the frontend origin. Use same-site domains or a same-origin API rewrite and verify cookie behavior. Separate `vercel.app` and `onrender.com` domains can encounter third-party cookie restrictions.

Render's free web services block SMTP ports 465 and 587, so Gmail SMTP would need a compatible hosting plan or replacement with an email HTTP API.

## Deployment checks

The completed checks are recorded in [testing notes](validation.md). After changing a deployment, check `/api/health`, sign-in, a protected deep link, photo uploads, filters and the sitemap. Changes to email settings also need a delivery check before treating them as verified.

## Current limits

JSON storage is only for a single local process and is blocked in production. Rate limits are held in process memory and reset on restart; multiple instances would need a shared limiter.

Removing a listing archives it and cancels active viewings. Archived images are retained. A failed remote image deletion may require a cleanup pass in ImageKit.

Viewing requests remain saved if their email fails, with a private management link returned to the guest. Password-reset responses stay generic, so server logs are needed when investigating delivery failures.

Backups and retention rules for archived listings and contact details would need to be established before using this as a public marketplace. Ownership-document verification and payment processing are outside this project's scope.
