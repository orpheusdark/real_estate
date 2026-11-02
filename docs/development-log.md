# My development journal

## I started with separate web and API apps

I created the two-app workspace, React/TypeScript build settings, API dependencies and environment examples. I kept production account values out of the repository and made local demo mode explicit.

## I built accounts, ownership and viewing APIs

I added Mongoose models and persistent local demo storage. I implemented JWT login, password reset, owner-only property management, image validation/storage, guest and authenticated appointments, cancellation, confirmation and security middleware.

## I connected the main website flows

I built the responsive EstateIQ identity, home collection, property search, gallery, booking form, account pages, listing editor and protected dashboard. I added API tests for permissions and the main workflows, then pushed my first three development milestones to GitHub.

## I checked the flows and prepared deployment

I ran the API and browser flows, normalized appointment times to prevent alternate-format slot conflicts, added rate-limit coverage, updated vulnerable dependencies and made session-version increments atomic. I added initial HTML property metadata for combined hosting, robots, a sitemap, deep links and hosting configuration. I kept the MongoDB test separate when its local binary download progressed too slowly.

## I documented my implementation

I added the API reference, requirements mapping, architecture, local/demo instructions, deployment alternatives, validation notes, setup checklist and screenshots. I kept the distinction between implemented features and integrations I had actually verified.

## I verified the MongoDB adapter on GitHub

I ran the explicit `TEST_MONGO=true` workflow against an isolated MongoDB process. My complete 18-test API suite passed, alongside the JSON-demo suite, production build and dependency audit. At that stage, I had verified the adapter rather than a configured Atlas deployment.

## I expanded the home collection

I added 18 illustrative homes across Indian cities, with fuller descriptions, amenities and three-photo galleries. I optimized 12 WebP photos and kept their source identifiers in a credits manifest. I made demo seeding idempotent so I could add missing sample homes without deleting unrelated properties or duplicating the collection.

## I published an initial browsing preview

I linked my EstateIQ Vercel project to GitHub and published a read-only catalog while I finished the database setup. I labelled the preview and withheld account/booking forms until the live services were connected. I added checks for gallery assets, pagination, blocked writes, safe seeding and Vercel routing metadata.

## I connected and checked the live platform

I corrected the private database password formatting, updated Atlas network access, verified connectivity and seeded the 18 homes. I saved credentials in private Vercel environment settings, enabled the full same-origin Express API and sent uploads one file per request to respect Vercel's payload limit.

I checked registration, session persistence after refresh, login/logout, listing creation, four real ImageKit uploads, filters, galleries and responsive layouts in live Chrome. I removed my temporary test account, listing and images. I chose not to send email, so I did not test live email delivery or viewing submission.

## I completed the deployment checks

I added a read-only startup fallback with retry behavior and tests, bringing my local API/catalog suite to 24 tests. I corrected Vercel's sitemap handling so it serves the actual database listing IDs. I also protected the local booking smoke test from running against connected email services.
