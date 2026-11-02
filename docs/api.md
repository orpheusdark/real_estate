# How I designed the REST API

I grouped application endpoints under `/api` and return JSON errors as `{ "message": "..." }`. I support HttpOnly session cookies and `Authorization: Bearer <token>`. I return a token from login/register for API clients, while my React client uses the cookie without persisting JWTs in browser storage. I require the configured frontend Origin for cookie-authenticated writes and include browser credentials through Axios.

## My endpoints

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

## How I handle search and property data

I accept `q`, `location`, `type`, `purpose`, `minPrice`, `maxPrice`, `minArea`, `maxArea`, `bedrooms`, `sort`, `page` and `limit` on `GET /properties`. I default to newest-first sorting and also support `price-asc` and `price-desc`. I cap the page size at 24 and return `{items,total,page,pages}`. I escape search text into literal expressions rather than accepting MongoDB operators from the client.

I use the following property body:

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

I support `Apartment`, `Villa`, `Independent house`, `Plot` and `Commercial` types, with `Buy` or `Rent` as the purpose. I treat rent prices as monthly INR and allow zero bedrooms/bathrooms for plots or commercial properties. I reject owner and image fields in the editable property body.

## How I handle viewings

I accept `{name,email,phone,startsAt}`, with `startsAt` as an ISO UTC datetime. I allow hourly starts from 09:00 through 18:00 IST, between one hour and 90 days ahead. I return `{appointment,manageToken,emailSent}` after creating a request and keep the stored management-token hash out of dashboard responses.

I accept `{status:"confirmed"}` or `{status:"cancelled"}` for status changes and prevent cancelled requests from reopening. I limit confirmation to the property owner and allow the attendee to cancel.

## My response and hosting behavior

I use 400 for invalid input, 401 for an invalid session, 403 for permission/origin rejection, 404 for missing or archived resources, 409 for conflicts, 429 for rate limits, 500 for generic server errors and 502 for storage errors. I keep internal stack traces and credentials out of responses.

I expose `/robots.txt` and `/sitemap.xml` at the website root. I serve the built frontend and deep links through Express in combined hosting, and use a same-origin Vercel function for the current deployment. I send photos one per request, with a 4 MB per-file limit and a maximum of four images per property.
