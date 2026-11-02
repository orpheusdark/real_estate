# Development journal

## Started EstateIQ with separate web and API apps

Created the two-app workspace, React/TypeScript build settings, API dependencies and environment examples. Kept production account values out of the repository and made local demo mode explicit.

## Built accounts, property ownership and viewing APIs

Added Mongoose models and a persistent demo adapter, JWT login and reset flows, owner-only property management, image validation/storage, guest and user appointments, cancellation and confirmation, plus security middleware.

## Connected the home search, listing editor and viewing dashboards

Built the responsive EstateIQ identity, home collection, property search, gallery, booking form, account pages, listing editor and protected dashboard. Added API tests for permissions and the main workflows. Pushed these first three genuine milestones to GitHub.

## Checked the main flows and prepared deployment

Ran the actual API and browser flows, normalized appointment times to prevent alternate-format slot conflicts, added rate-limit coverage, updated vulnerable dependencies, and made session-version increments atomic. Added initial HTML property metadata for combined hosting, robots, sitemap, static deep links and hosting configuration. Kept the MongoDB test separate when its local binary download could not finish in a useful time.

## Documented the build and remaining configuration

Added the API reference, requirement mapping, architecture, local/demo usage, deployment alternatives, accurate validation notes, service setup checklist and screenshots. No account credentials or live integration successes were invented.

## Verified the MongoDB adapter on GitHub

The explicit `TEST_MONGO=true` workflow passed the complete 18-test suite against an isolated MongoDB process, in addition to the JSON-demo suite, production build and dependency audit. This verifies the Mongoose adapter without implying any Atlas, ImageKit, SMTP or deployment credentials were configured.

## Expanded homes and deployed the browsing preview

Added 18 illustrative homes across Indian cities with fuller descriptions, amenities and three-photo galleries. Twelve optimized WebP photos are served locally, with source identifiers retained in the credits manifest. Demo seeding adds missing sample homes without deleting user properties or duplicating the collection.

Linked the EstateIQ Vercel project to GitHub and published a read-only catalog while database authentication is pending. Added explicit preview messaging and withheld account/booking forms so visitors cannot mistake a sample catalog for a connected marketplace. Added tests for gallery assets, pagination, blocked writes, idempotent seeding and serverless routing metadata. No credentials are deployed with the preview.

## Connected and verified the full live platform

Corrected private database password formatting, verified Atlas connectivity and seeded the 18 homes. Applied service credentials through private Vercel environment settings, enabled the full same-origin Express API and adapted image uploads to one file per request. Atlas network access was updated by the user.

Live Chrome checks passed registration, persistent cookie sessions, login/logout, property creation, four real ImageKit uploads, property filters, galleries and responsive layouts. All temporary live test records and images were removed. No email was sent and live viewing submission was not tested, respecting the user's instruction to skip email. Added startup fallback and sitemap coverage for temporary database unavailability.
