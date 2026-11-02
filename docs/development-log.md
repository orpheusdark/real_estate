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
