# Validation record

Build session: 2 November 2026. Results refer to local checks, not to live external integrations.

## Passed

- `npm test`: 18 tests, all passed, against isolated local JSON storage, actual Express HTTP endpoints, actual bcrypt/JWT and actual Sharp image conversion.
- `npm run build`: strict TypeScript compilation, SEO file generation and optimized Vite production build.
- `npm run check`: included in build through the same TypeScript project.
- Headless installed Chrome: home and property cards, 1440 px desktop and 390 px mobile viewports, mobile registration, dashboard access, listing creation and actual local image upload, logout, guest booking, private status page and cancellation. No browser page errors. Neither viewport had horizontal overflow.
- `npm audit`: zero known vulnerabilities after upgrading Nodemailer and Sharp to patched releases.

The API suite exercises configuration guards, password hashing, duplicate registration, invalid auth, current-user lookup, cookie-origin checks, mass assignment rejection, cross-owner edit/delete/upload rejection, filter/pagination behavior, invalid and oversized images, four-image limits, guest and authenticated bookings, conflicting slot formats, past/off-hour dates, permission checks, owner confirmation, cancellation, reset outbox and single-use tokens, session revocation, security headers/CORS, sitemap/robots, archived listings and persistent local storage, and rate limiting.

- GitHub Actions: the same 18-test suite passed against an isolated real MongoDB instance through Mongoose. The API tests, production build and production audit steps also passed in [run 41393536949](https://github.com/orpheusdark/real_eastate/actions/runs/41393536949).
- Combined local hosting: initial property HTML contains the property title and social image metadata; dashboard HTML has noindex tags; unknown routes return 404; API unknown routes retain JSON errors.

## Not configured or claimed as live

- Local Windows MongoDB binary download was stopped after progressing too slowly. The database suite passed separately on GitHub Actions; no Atlas connection was used.
- Real MongoDB Atlas connectivity, production indexes and credentials.
- Real ImageKit uploads/deletions or SMTP delivery.
- Production HTTPS cookies across chosen hosting domains, custom domains and hosted deep links.
- A live Vercel or Render deployment.

Screenshots in `docs/screenshots/` are local demo captures. Seed imagery comes from Unsplash and can depend on network availability. Browser smoke tests use an actual uploaded PNG fixture for the image workflow.

## Subsequent live deployment verification

The full app is deployed at https://estateiq-rho-ten.vercel.app . The expanded local API/catalog suite has 24 passing tests. The production build and strict TypeScript check pass.

Atlas connection and ping passed after the user updated network access. Gmail SMTP authentication passed; no email was sent. ImageKit credentials passed, followed by four actual uploads through the live property editor. Live Chrome checks passed registration, session persistence on refresh, logout/login, property creation, image display, city/rent filtering, gallery selection and mobile/tablet/desktop layouts without page errors. Temporary test images, listing and account were removed.

Email delivery, reset-link delivery and live viewing submission remain untested at the user's request to skip email. These flows have automated local API coverage; do not equate that with confirmed production email delivery.
