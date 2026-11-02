# My validation record

I deployed EstateIQ at https://estateiq-rho-ten.vercel.app . I distinguish the live service checks I performed from my isolated automated tests.

## What I verified locally and in automation

- I passed 24 tests with `npm test`, covering accounts, password hashing/reset tokens, session revocation, ownership, mass assignment, image validation/limits, filters, pagination, appointments, slot conflicts, status permissions, cancellation, headers/CORS, rate limits, archival, demo persistence, gallery assets, safe seeding, Vercel routing metadata and startup fallback.
- I passed `npm run build`, including strict TypeScript, SEO generation and optimized Vite output.
- I verified the real Mongoose adapter's API suite on GitHub Actions with an isolated MongoDB process, separately from my later Atlas checks.
- I checked registration, listings, uploads, dashboard, guest viewing and cancellation in local Chrome demo mode. I also checked empty results, protected-route redirects, missing pages and responsive layouts.

## What I verified against real services

- I connected to MongoDB Atlas and passed a database ping after correcting password formatting and network access. I seeded the 18 illustrative homes under my owner account.
- I verified Gmail SMTP connection and authentication without sending an email.
- I verified the ImageKit key, then uploaded four actual images through the live property editor and displayed them in its gallery.
- I checked live browsing, image loading, city/rent filtering, gallery selection, registration, cookie persistence after refresh, logout/login, property creation and mobile/tablet/desktop layouts in Chrome. I observed no browser page errors.
- I removed my temporary live test account, property and ImageKit images after verification.
- I checked that the published sitemap returns actual database property IDs and that both the local and live APIs report connected mode.

## What I have not verified live

I chose to skip sending email during setup. I therefore have not tested production email delivery, reset-link delivery or live viewing submission. I covered the reset and appointment flows in local API tests, but I do not treat that as proof of live email delivery.

I added a guard that stops the local booking smoke script unless the API reports demo mode. I also added an explicit read-only sample catalog for production startup failures, rejecting writes until the live services reconnect.
