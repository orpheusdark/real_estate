# Validation record

EstateIQ is live at https://estateiq-rho-ten.vercel.app . These results distinguish real service checks from isolated test coverage.

## Passed locally and in automation

- `npm test`: 24 API/catalog tests, covering accounts, password hashing and reset tokens, session revocation, ownership and mass assignment, image limits and invalid files, property filters and pagination, guest/user appointments, slot conflicts, status permissions, cancellations, headers/CORS, rate limits, archival, persistent demo storage, gallery assets, safe seeding, Vercel route metadata and read-only startup fallback.
- `npm run build`: strict TypeScript, SEO generation and optimized Vite output.
- The real Mongoose adapter's API suite passed on GitHub Actions using an isolated MongoDB process. This is separate from the later Atlas verification below.
- Local Chrome demo checks passed registration, listings, image upload, dashboard, guest viewing and cancellation; separate checks covered empty results, protected-route redirects, missing pages and responsive layouts.

## Verified against real services

- MongoDB Atlas connection and ping passed after password formatting and network access were corrected. The 18 illustrative homes were seeded under the owner account.
- Gmail SMTP connection and authentication passed. No email was sent.
- ImageKit credentials passed, then the live Vercel property editor successfully uploaded four actual images and displayed them in its gallery.
- Live Chrome passed property browsing, image loading, city/rent filtering, gallery selection, registration, cookie-session persistence after refresh, logout/login, listing creation, and mobile/tablet/desktop layouts with no page errors.
- The temporary live test account, property and ImageKit images were removed after verification.

## Explicitly not tested

Email delivery, reset-link delivery and live viewing submission were skipped because the user asked to skip email. These flows have automated local API coverage, which is not a claim that production email delivery was tested.

The local booking smoke script refuses to run unless the API reports demo mode, preventing it from sending test bookings through real email services. Production startup failures expose a labelled read-only sample catalog; write requests are rejected until services reconnect.
