# API reference

All application routes use the `/api` prefix. Errors return `{ "message": "..." }` with an HTTP status code.

Authentication accepts either the HttpOnly session cookie or `Authorization: Bearer <token>`. Login and registration return a token for API clients. The React app uses the cookie and does not save JWTs in browser storage. Cookie-authenticated writes require the configured frontend Origin header.

## Routes

| Method | Endpoint                             | Access / action                                              |
| ------ | ------------------------------------ | ------------------------------------------------------------ |
| GET    | `/health`                            | Health and storage mode                                      |
| POST   | `/auth/register`                     | `{name,email,password}`; 201, cookie + user + token          |
| POST   | `/auth/login`                        | `{email,password}`; cookie + user + token                    |
| POST   | `/auth/logout`                       | Signed in; revokes existing sessions                         |
| POST   | `/auth/forgot-password`              | `{email}`; generic response, reset email if registered       |
| POST   | `/auth/reset-password`               | `{token,password}`; consumes token and invalidates sessions  |
| GET    | `/users/me`                          | Signed in; public current-user fields                        |
| GET    | `/properties`                        | Public paginated search                                      |
| GET    | `/properties/:id`                    | Public active property                                       |
| POST   | `/properties`                        | Signed in; create a listing                                  |
| PATCH  | `/properties/:id`                    | Owner; replace editable property details                     |
| DELETE | `/properties/:id`                    | Owner; archive listing and cancel its active appointments    |
| POST   | `/properties/:id/images`             | Owner; multipart field `images`, up to 4 total, 4 MB/file    |
| DELETE | `/properties/:id/images/:fileId`     | Owner; remove an image                                       |
| POST   | `/properties/:id/appointments/guest` | Guest viewing request                                        |
| POST   | `/properties/:id/appointments`       | Signed-in viewing request                                    |
| GET    | `/appointments/manage/:token`        | Private guest link, current status                           |
| POST   | `/appointments/manage/:token/cancel` | Private guest link, cancel                                   |
| PATCH  | `/appointments/:id`                  | Owner confirms/cancels; attendee can cancel                  |
| GET    | `/dashboard`                         | Signed in; own listings, own appointments, incoming requests |

## Property search

`GET /properties` accepts:

| Parameter              | Use                                                  |
| ---------------------- | ---------------------------------------------------- |
| `q`                    | Keyword search                                       |
| `location`             | City/location search                                 |
| `type`                 | Property type                                        |
| `purpose`              | `Buy` or `Rent`                                      |
| `minPrice`, `maxPrice` | Price range in INR                                   |
| `minArea`, `maxArea`   | Area range in square feet                            |
| `bedrooms`             | Minimum bedrooms                                     |
| `sort`                 | Newest first by default; `price-asc` or `price-desc` |
| `page`, `limit`        | Pagination, with a maximum page size of 24           |

The response is `{items,total,page,pages}`. Search text is escaped and treated as a literal expression; client-supplied MongoDB operators are not accepted.

## Property body

```json
{
  "title": "A bright apartment in Indiranagar",
  "description": "A spacious apartment with a balcony, natural light and easy access to neighbourhood shops.",
  "location": "Bengaluru",
  "address": "Indiranagar, Bengaluru",
  "type": "Apartment",
  "purpose": "Buy",
  "price": 9500000,
  "area": 1400,
  "bedrooms": 2,
  "bathrooms": 2,
  "amenities": ["Parking", "Balcony"]
}
```

Supported types are `Apartment`, `Villa`, `Independent house`, `Plot` and `Commercial`. Rent is monthly INR. Bedrooms and bathrooms may be zero for plots or commercial properties.

Ownership is taken from the authenticated account. Owner and image fields cannot be assigned through this body. Upload photos separately using the multipart `images` field. The editor sends one photo per request, with a maximum of 4 MB per file and four photos per property.

## Viewing requests

The request body is `{name,email,phone,startsAt}`, where `startsAt` is an ISO UTC datetime. Slots start hourly from 09:00 through 18:00 IST, between one hour and 90 days ahead.

A successful request returns `{appointment,manageToken,emailSent}`. The management link is private; dashboard responses do not expose its stored hash.

Status changes accept `{status:"confirmed"}` or `{status:"cancelled"}`. Only the owner can confirm a viewing. The attendee can cancel, and cancelled requests cannot be reopened.

## Status codes

| Code | Meaning                       |
| ---- | ----------------------------- |
| 400  | Invalid input                 |
| 401  | Missing or invalid session    |
| 403  | Permission or origin rejected |
| 404  | Missing or archived resource  |
| 409  | Conflict                      |
| 429  | Rate limit reached            |
| 500  | Server error                  |
| 502  | External storage error        |

Internal stack traces and credentials are kept out of responses. `/robots.txt` and `/sitemap.xml` are available at the website root. The current deployment serves the frontend and API from the same Vercel origin.
