# REST API

All application endpoints use `/api`. JSON errors have `{ "message": "..." }`. Authentication supports the HttpOnly session cookie and `Authorization: Bearer <token>`. Login/register return a token for API clients; the React client uses the cookie and does not persist JWTs in browser storage. Cookie writes require the configured frontend Origin header. Browser requests include credentials through Axios.

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

`GET /properties` accepts `q`, `location`, `type`, `purpose`, `minPrice`, `maxPrice`, `minArea`, `maxArea`, `bedrooms`, `sort`, `page`, `limit`. Sort is newest by default, `price-asc`, or `price-desc`. Limit is capped at 24. Result: `{items,total,page,pages}`. Search uses escaped literal expressions, never client-supplied MongoDB operators.

Property body:

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

Types: `Apartment`, `Villa`, `Independent house`, `Plot`, `Commercial`. Purpose: `Buy` or `Rent`; rent prices are monthly INR. Bedrooms and bathrooms can be zero for plots/commercial properties. Owner and image fields cannot be assigned through the property body.

Viewing body: `{name,email,phone,startsAt}`, with `startsAt` an ISO UTC datetime. Slots start hourly from 09:00 through 18:00 IST, between one hour and 90 days ahead. Successful creation returns `{appointment,manageToken,emailSent}`. Keep the management token private; dashboards never expose its stored hash. Status changes use `{status:"confirmed"}` or `{status:"cancelled"}`. Cancelled requests cannot be reopened.

Common statuses: 400 invalid input, 401 no valid session, 403 permission/origin denied, 404 missing/archived resource, 409 conflict, 429 rate limit, 500 generic server error, 502 external storage error. Internal stack traces and credentials are not returned.

Public root endpoints: `/robots.txt` and `/sitemap.xml`. With a built frontend present, Express also serves the website and deep links.
