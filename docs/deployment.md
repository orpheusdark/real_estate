# How I configured services and deployed EstateIQ

I initially deferred account configuration until the application was built. I then connected the services and deployed the full application on Vercel. I keep credentials in local `.env` files and private hosting settings, outside Git.

## My backend settings

| Variable                              | How I configure it                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                            | `production` on the host                                                                         |
| `DEMO_MODE`                           | `false` on the host                                                                              |
| `MONGODB_URI`                         | Atlas connection string with a dedicated database and least-privilege database user              |
| `JWT_SECRET`                          | Random secret of at least 32 characters; use a different secret per environment                  |
| `FRONTEND_URL`                        | Exact HTTPS website origin, without trailing slash                                               |
| `PUBLIC_API_URL`                      | Exact HTTPS API origin, without trailing slash                                                   |
| `IMAGEKIT_PRIVATE_KEY`                | Private key, backend only                                                                        |
| `SMTP_HOST`, `SMTP_PORT`              | My provider's SMTP host and port                                                                 |
| `SMTP_SECURE`                         | `true` for implicit TLS, typically port 465; otherwise `false`, typically port 587 with STARTTLS |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Provider credentials and verified sender                                                         |
| `TRUST_PROXY`                         | `1` behind my trusted single Vercel/Render proxy; otherwise `0`                                  |
| `PORT`                                | Supplied by the hosting platform                                                                 |

I generate a JWT signing secret locally with:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

I save the output privately and never put it in documentation or Git history. I use a secret of at least 32 characters; rotating it signs existing sessions out.

I use a dedicated Atlas database user and configure network access for the application. I corrected URL encoding and removed template angle brackets from the database password before connecting. I updated the Atlas IP access list when the deployment could not reach the cluster. I initialize the `users`, `properties` and `appointments` collections and the unique email/viewing-slot indexes through Mongoose. I do not automatically import local demo JSON into production.

I pass uploads from Multer through Sharp for decoding, resizing and WebP conversion, then store them through ImageKit's server-side upload API under `/estateiq/properties`. I keep the private ImageKit key on the backend and expose only the returned image URLs to the browser.

I configure Gmail with `smtp.gmail.com`, port `587`, `SMTP_SECURE=false`, the sender address and a Google app password. I verified SMTP authentication without sending email. I keep the app password private rather than using my normal Google account password.

## My current full-stack Vercel deployment

**My live site:** https://estateiq-rho-ten.vercel.app

I created the `estateiq` project in my `orpheusdarks-projects` workspace and linked it to this GitHub repository for automatic deployments. I use Node.js 24, `npm ci` for installation, `npm run build` for the build and `frontend/dist` for the static output.

I route API requests through `api/server.js` to the full Express app when `LIVE_SERVICES=true`. I reuse the MongoDB connection across warm requests and enforce production configuration, `DEMO_MODE=false` and a trusted single Vercel proxy in that function. I remove Vercel's internal wildcard query fields before validating application filters.

I leave `VITE_API_URL` empty and use relative `/api` requests so the frontend and authentication cookies share one origin. I point `FRONTEND_URL`, `PUBLIC_API_URL` and `VITE_SITE_URL` to the live website. I use `VITE_` variables only for public values, never database strings, private keys, SMTP passwords or signing secrets.

I store `MONGODB_URI`, `JWT_SECRET`, `IMAGEKIT_PRIVATE_KEY`, `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM` as private Vercel settings. I keep public origins and other non-secret values in ordinary configuration. I exclude private environment files, local data and uploads from deployment inputs.

I seeded 18 illustrative homes under the owner account associated with my configured university email. I generated its initial password randomly and did not send or expose it. When I am ready to choose an owner password, I can use Forgot password. I have not sent that reset email during setup. I also allow normal registration for other accounts.

I accept four images per property, up to 4 MB per file. I send one image per request so uploads stay below Vercel's 4.5 MB function payload limit. I route `/sitemap.xml` to the API for actual database listing IDs, and remove the static sitemap from the Vercel build output so it cannot take precedence over that route.

If the live app cannot initialize, I serve a labelled, read-only sample catalog and retry after 30 seconds. I reject account, listing and booking writes during that fallback. If I intentionally want a showcase-only deployment, I set `LIVE_SERVICES=false` and redeploy.

## How I run the connected app locally

I set `DEMO_MODE=false` in my private local environment and run `npm run dev` to use Atlas and ImageKit. If I want an isolated local demonstration, I explicitly set `DEMO_MODE=true`. I forbid JSON demo storage in production.

I use `npm run services:check` to verify database connectivity and SMTP authentication without sending an email. I restart the local API after changing environment settings.

## My alternative Render deployment options

I prepared `render.yaml` as an alternative; I have not created a Render deployment for EstateIQ.

If I deploy everything as one Render service, I use the repository root, build with `npm ci && npm run build`, start with `npm start` and check `/api/health`. I set `FRONTEND_URL`, `PUBLIC_API_URL` and `VITE_SITE_URL` to the same HTTPS origin and leave `VITE_API_URL` empty. I can also use this combined Express option for property-specific metadata in the initial HTML.

If I split the Vercel frontend and Render API, I set `VITE_API_URL` to the API origin, `VITE_SITE_URL` to the website origin, and Render's `FRONTEND_URL` to that exact website origin. I redeploy after changing build-time values. I would use same-site custom domains or a same-origin `/api` rewrite and verify cookies in the target browsers, since separate `vercel.app` and `onrender.com` domains can encounter third-party cookie restrictions.

I would check the hosting plan's SMTP restrictions before moving the API: Render's free web services block SMTP ports 465 and 587. I would need a compatible hosting plan or an email HTTP API for that option.

## What I checked after deployment

- I confirmed that the local and live `/api/health` endpoints report `connected`.
- I verified Atlas connection/ping, seeded listings and ImageKit credentials.
- I checked live registration, login/logout, session persistence on refresh, listing creation and four actual ImageKit uploads in Chrome.
- I checked live filters, galleries, photo assets and mobile/tablet/desktop layouts without browser page errors.
- I verified that the published sitemap includes actual database property IDs.
- I removed my temporary live test account, listing and images.
- I passed Gmail SMTP authentication, but chose not to send email. I therefore have not checked production email delivery, reset-link delivery or live viewing submission.

I covered ownership rejection, password reset, guest/authenticated viewings, slot conflicts, confirmation/cancellation, validation, CORS, rate limits and other error cases in automated local API tests. Before claiming those flows are tested in production, I would run the corresponding live acceptance checks and verify their results.

## My operational limits

I use JSON storage only for one-process local demonstrations. My production rate limits are in-process and reset on restart; I would add a shared limiter before scaling across instances. I archive removed listings and cancel their active requests, while retaining archived images. I log generic cleanup failures and may need an ImageKit cleanup pass if a remote deletion fails.

I keep a saved viewing request even if its email fails, and provide the private guest management link in the UI. I keep password-reset responses generic even on delivery failure and check server logs when investigating email issues.

Before operating a public marketplace, I would define database backups and retention rules for archived listings and contact details. I have not added ownership-document verification or payment processing; I kept those outside the supplied core project scope.
