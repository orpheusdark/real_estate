# Testing notes

Live site: https://estateiq-rho-ten.vercel.app

## Automated checks

| Check              | Result                                                     |
| ------------------ | ---------------------------------------------------------- |
| `npm test`         | 24 API/catalog tests passed                                |
| `npm run check`    | Strict frontend TypeScript passed                          |
| `npm run build`    | SEO generation and production build passed                 |
| Mongoose API suite | Passed on GitHub Actions with an isolated MongoDB instance |
| Dependency audit   | Zero known vulnerabilities at the time of the check        |

The API tests cover authentication, reset tokens, session revocation, ownership, invalid inputs, image limits, filtering, pagination, appointments, slot conflicts, confirmation/cancellation, security headers, CORS and rate limits. Other checks cover demo persistence, sample seeding, photo assets, Vercel routing fields and startup fallback.

## Browser checks

The local demo was checked in Chrome for registration, listings, uploads, dashboard access, guest viewing requests and cancellation. Empty search results, protected-page redirects and missing pages were also checked.

On the deployed site, I checked:

- Home page photos and property browsing
- City/rent filtering and gallery selection
- Registration and login/logout
- Staying signed in after a refresh
- Creating a listing and uploading four photos to ImageKit
- Mobile, tablet and desktop layouts

No browser page errors were observed during those live checks. The temporary account, listing and images were removed afterward.

## Service checks

- Atlas connection and database ping passed.
- The 18 sample homes were saved under the owner account.
- Gmail SMTP connection and authentication passed without sending email.
- ImageKit credentials were accepted, followed by four successful uploads through the live editor.
- The published sitemap returned actual database listing IDs.
- Both local and live API health checks reported connected mode.

## Still to verify

Production email delivery, password-reset email delivery and live viewing submission have not been tested. Local API coverage for these flows does not confirm that production emails reach an inbox.

The booking browser test stops unless the API reports demo mode. During a production startup failure, the site falls back to labelled sample browsing and rejects writes until services reconnect.
