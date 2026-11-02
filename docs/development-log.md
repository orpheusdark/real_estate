# Development notes

## Starting the project

I started with separate `frontend` and `backend` folders. React and TypeScript handle the pages, while Express provides the API. Environment examples and local demo mode were added early so the project could run before the external accounts were configured.

## Accounts and properties

The first backend work covered the User, Property and Appointment models, followed by registration, login and password reset. Property ownership is checked on the server: hiding an edit button alone would not stop another account from making an API request.

Next came listing creation, editing and removal, along with photo uploads. Multer receives the files and Sharp validates and converts them before they reach ImageKit.

## Connecting the frontend

Built the home page, search filters, property details, gallery, account forms and dashboard. The dashboard separates personal viewings from requests received for owned listings.

Guest bookings use the same appointment model as registered bookings. A private link lets a guest check or cancel a request without creating an account.

## Testing the main flows

Added tests for authentication, ownership, invalid uploads and appointment permissions. One issue was that different timestamp formats could represent the same viewing slot. Normalizing the timestamp before creating the slot key fixed that.

Password reset tokens are single-use, and resetting a password invalidates old sessions. Logout also revokes the account's existing sessions.

The local MongoDB binary download was slow, so the database adapter was checked separately on GitHub Actions. That API suite passed against an isolated MongoDB instance.

## Adding sample homes

Added 18 sample homes across Indian cities, with descriptions, amenities and three-photo galleries. The collection uses 12 optimized WebP images. Seeding can run again without duplicating the homes or deleting unrelated listings.

The listings are labelled as examples because the photographs and prices do not represent verified property offers.

## Deployment issues

The first Vercel version was a browsing preview while the database setup was pending. After connecting Atlas, ImageKit and Gmail, the same-origin Express API was enabled.

A few details needed attention:

- The Atlas password needed URL encoding and still had template angle brackets around it.
- Atlas network access had to allow the deployment to connect.
- Vercel added internal routing fields to requests, which initially broke the property filters.
- Uploading photos together could exceed Vercel's payload limit, so the editor now sends one file per request, up to 4 MB each.
- A static sitemap took precedence over the API route. Removing it from the Vercel build output allowed the database sitemap to be served.

## Final checks

I checked the live site in Chrome: registration, login/logout, session persistence, listing creation, four ImageKit uploads, filters, gallery selection and responsive layouts. The temporary test account, listing and uploaded images were cleaned up afterward.

The local API/catalog suite now has 24 passing tests. A read-only fallback keeps sample browsing available if the live app cannot initialize, while account and booking changes remain blocked. The connection is retried after 30 seconds.

Email delivery and live viewing submission are still unchecked. SMTP authentication passed, but no email was sent during setup. The local booking browser test is restricted to demo mode to avoid sending test messages through real services.
