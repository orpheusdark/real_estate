# Service setup and deployment

Account configuration was initially deferred until after building. The full application is now deployed on Vercel; the current setup is described below. Do not paste secrets into chat or commit them. Configure them directly in your local `.env` or hosting environment settings.

## Required backend values

| Variable                              | Value to configure                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                            | `production` on the host                                                                         |
| `DEMO_MODE`                           | `false` on the host                                                                              |
| `MONGODB_URI`                         | Atlas connection string with a dedicated database and least-privilege database user              |
| `JWT_SECRET`                          | Random secret of at least 32 characters; use a different secret per environment                  |
| `FRONTEND_URL`                        | Exact HTTPS website origin, without trailing slash                                               |
| `PUBLIC_API_URL`                      | Exact HTTPS API origin, without trailing slash                                                   |
| `IMAGEKIT_PRIVATE_KEY`                | Private key, backend only                                                                        |
| `SMTP_HOST`, `SMTP_PORT`              | Your provider's SMTP host and port                                                               |
| `SMTP_SECURE`                         | `true` for implicit TLS, typically port 465; otherwise `false`, typically port 587 with STARTTLS |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Provider credentials and verified sender                                                         |
| `TRUST_PROXY`                         | `1` only behind the trusted single proxy used by Render; otherwise `0`                           |
| `PORT`                                | Supplied by the hosting platform                                                                 |

Generate a JWT secret on your own machine with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`, then save it privately. Rotating it signs everyone out. This command prints a secret; do not copy its output into documentation or Git history.

Atlas creates the `users`, `properties` and `appointments` collections through Mongoose. Startup initializes the email and viewing-slot unique indexes. Allow the server's network access in Atlas; use the narrowest available network rules. Use an empty production database: demo JSON data is not automatically imported.

Uploads go from Multer through Sharp for validation, resizing and WebP conversion, then to ImageKit's server-side REST upload endpoint. Only the private key is needed for this server flow; no ImageKit key is exposed to the browser. Files are stored under `/estateiq/properties`. Verify that the account serves returned HTTPS image URLs.

## Option A: one Render service, one origin

This is the simplest cookie-compatible deployment. The Express server serves both the built React app and `/api`. It also injects property-specific SEO metadata into the initial property HTML.

1. Create a Render Blueprint from this repository using `render.yaml`, or create a Node web service with repository root as its root directory.
2. Build: `npm ci && npm run build`. Start: `npm start`. Health: `/api/health`.
3. Set the backend values above. Set `FRONTEND_URL`, `PUBLIC_API_URL` and `VITE_SITE_URL` to the **same** Render HTTPS origin (or the same custom website origin). Leave `VITE_API_URL` empty for same-origin requests.
4. Deploy and run the live checklist below. No persistent filesystem is required in production because records use MongoDB and images use ImageKit.

The included Blueprint generates a JWT secret, but the other account values remain manual. No Render deployment was created; the current live deployment uses Vercel.

## Option B: Vercel frontend and Render API

The repository includes root `vercel.json` for the static Vite frontend and deep-link rewrites. Import the repository root into Vercel; build `npm run build`; output `frontend/dist`; install `npm ci`.

- Set Vercel `VITE_API_URL` to the Render API HTTPS origin and `VITE_SITE_URL` to the Vercel website HTTPS origin. Redeploy after changing these build-time values.
- Set Render `FRONTEND_URL` to that exact frontend origin and `PUBLIC_API_URL` to its API origin. CORS and reset/booking email links use these settings.
- Use same-site custom domains, for example a website on `estateiq.example` and API on `api.estateiq.example`, or configure a same-origin external `/api` rewrite to the Render API. With a rewrite, leave `VITE_API_URL` blank. Update the `vercel.json` rewrites before the SPA fallback with your actual API host when configuring this route.
- Separate `vercel.app` and `onrender.com` origins use cross-site cookies. Although the API sets Secure, HttpOnly and SameSite=None in production, some browsers block third-party cookies. Use the same-site or same-origin arrangement above and verify it in your target browsers.
- Static Vercel pages update title, description and canonical tags in the browser. For property-specific social preview metadata in the initial HTML, use the combined Render deployment. Both configurations provide sitemaps; the API sitemap includes every active property.

Never use `VITE_` names for private keys, MongoDB strings, SMTP passwords or JWT secrets. Build-time public origins are safe to expose.

## Live acceptance checklist after configuration

- Confirm `/api/health` reports `connected`, not `demo`.
- Register two accounts, sign in, refresh a protected deep link such as `/dashboard`, and sign out.
- Upload four real images, inspect their ImageKit URLs, remove one, and check the gallery.
- Confirm the second account receives 403 when editing or deleting the first account's listing.
- Submit guest and authenticated viewings; confirm from the owner's dashboard; cancel from the user's dashboard and a guest private link.
- Request a password reset. Verify real email delivery, reset the password, then verify that old sessions and a reused reset link fail.
- Test unknown emails, wrong passwords, invalid inputs, duplicate viewing slots and unavailable storage.
- Visit `/robots.txt`, `/sitemap.xml` and a property deep link. Verify the expected website origin in canonical tags and email links.
- Confirm denied CORS origins do not receive allow-origin headers and cookie-authenticated writes from other origins fail.
- Check Render and Vercel logs without exposing tokens or connection strings. Review GitHub checks.

## Operational boundaries

Demo JSON storage is single-process development storage and is forbidden in production. Production rate limits are in-process and reset on restart; use a shared limiter before scaling to multiple instances. Listing removal archives the property and cancels active requests; archived images remain for record retention. Failed remote image cleanup logs a generic message and may need an ImageKit cleanup pass. Email failures do not erase a successfully saved viewing; the UI gives the guest a private management link. Password-reset responses remain generic even when delivery fails, so monitor delivery logs.

Keep database backups and define a retention policy for archived listings and personal contact details before operating a public marketplace. The application does not verify property ownership documents or handle payments. These are separate product capabilities, not parts of the supplied core guide.

## Current full-stack Vercel deployment

Live site: https://estateiq-rho-ten.vercel.app . Project: `estateiq`, workspace: `orpheusdarks-projects`. GitHub is connected for deployment from this repository.

The root `api/server.js` function routes requests to the full Express application when `LIVE_SERVICES=true`. MongoDB connections are reused across warm requests. `DEMO_MODE=false`, a production configuration and a single trusted Vercel proxy are enforced for this function. The frontend uses relative `/api` requests, so authentication cookies remain on the same origin. Vercel wildcard routing metadata is removed before validating application filters.

Private Vercel environment settings contain `MONGODB_URI`, `JWT_SECRET`, `IMAGEKIT_PRIVATE_KEY`, `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM`. Public origins and non-secret settings use plain configuration values. `VITE_API_URL` stays empty; `FRONTEND_URL`, `PUBLIC_API_URL` and `VITE_SITE_URL` point to the live origin. Do not commit `.env` files or copy private values into deployment commands or logs.

MongoDB holds the 18 illustrative listings, seeded under the configured university email's owner account. The initial owner password was generated randomly and was not sent or exposed; use Forgot password when ready to choose an owner password. No reset email was sent during setup, at the user's request. Other users can register normally.

Photo uploads accept up to four images, maximum 4 MB per file. The editor sends one file per request to stay below Vercel's 4.5 MB function payload limit. Sharp decodes and converts the images before ImageKit stores them. The dynamic `/sitemap.xml` route comes from the API and reflects actual database property IDs.

If the live application cannot initialize, the function serves an explicit read-only sample catalog and retries after 30 seconds. It never pretends to save account, property or booking mutations during fallback. Set `LIVE_SERVICES=false` and redeploy only when an intentional showcase-only deployment is wanted.

Verification completed: Atlas connection and ping, Gmail SMTP authentication without sending email, ImageKit credential verification, and live Chrome registration, persisted cookie sessions, login/logout, property creation and four actual ImageKit uploads. Temporary test images and database records were removed. Email delivery and live booking submissions were not exercised because the user asked to skip email.

The local `.env` now also has `DEMO_MODE=false`; `npm run dev` uses Atlas and ImageKit. To run an isolated JSON demo instead, explicitly set `DEMO_MODE=true` locally. Production refuses JSON demo storage.
