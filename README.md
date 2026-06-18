# StayEase — Hotel Booking Frontend

Angular 17 SPA for the StayEase hotel booking system.

## Tech stack
- **Angular 17** — standalone components, signals, new control flow (`@if`, `@for`)
- **Supabase JS** — auth (JWT), session management
- **Vercel** — deployment with SPA rewrite rules

---

## Project structure

```
src/app/
├── core/
│   ├── auth/           AuthService, guards (authGuard, guestGuard, staffGuard)
│   ├── interceptors/   authInterceptor — attaches JWT to API requests
│   ├── models/         Room, Reservation, Guest interfaces
│   └── services/       RoomsService, ReservationsService, GuestsService
├── layout/
│   └── navbar/         Navbar component (role-aware links)
├── features/
│   ├── auth/           Login, Register pages
│   ├── booking/        Room list, Room detail, Booking form, My reservations
│   └── admin/          Dashboard, Room management, Reservations management
└── shared/
    └── components/
        └── room-card/  Reusable room card
```

## User roles

| Role    | Access                                  |
|---------|-----------------------------------------|
| `guest` | Browse rooms, book, view own bookings   |
| `staff` | All guest access + admin area           |

Role is stored in Supabase `user_metadata.role` at sign-up.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Edit `src/environments/environment.ts`:
```ts
export const environment = {
  supabaseUrl:     'https://xxxx.supabase.co',
  supabaseAnonKey: 'your-anon-key',
  apiBaseUrl:      'https://localhost:52596/api',   // your C# API
};
```

### 3. Run locally
```bash
npm start
# → http://localhost:4200
```

---

## Deploy to Vercel

### Via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Via GitHub (recommended for presentation)
1. Push this repo to GitHub
2. Import project at vercel.com
3. Set build command: `ng build`
4. Set output directory: `dist/hotel-booking/browser`
5. Add environment variables in Vercel dashboard:
   - `NG_APP_SUPABASE_URL`
   - `NG_APP_SUPABASE_ANON_KEY`
   - `NG_APP_API_BASE_URL`

The `vercel.json` already handles SPA routing (all paths → index.html).

---

## Connecting to the C# API

All HTTP calls go to `environment.apiBaseUrl`. The `authInterceptor` automatically
attaches the Supabase JWT as `Authorization: Bearer <token>` on every request.

Expected API endpoints:

```
GET    /api/rooms
GET    /api/rooms/:id
GET    /api/rooms/available?checkIn=&checkOut=&roomTypeId=
POST   /api/rooms              (staff)
PUT    /api/rooms/:id          (staff)
DELETE /api/rooms/:id          (staff)

GET    /api/room-types

GET    /api/reservations        (staff)
GET    /api/reservations/my     (guest)
POST   /api/reservations
PATCH  /api/reservations/:id/cancel
PATCH  /api/reservations/:id/check-in   (staff)
PATCH  /api/reservations/:id/check-out  (staff)
PUT    /api/reservations/:id            (staff)

GET    /api/guests              (staff)
GET    /api/guests/me
PUT    /api/guests/me
```
