**Stats Endpoints**

Base: `/api/v1/stats`

All endpoints require authentication via `token` header (JWT).

Query params supported by most endpoints:
- `startDate` (ISO date string) - optional
- `endDate` (ISO date string) - optional
- `granularity` - one of `daily` (default), `weekly`, `monthly`

Endpoints:

1. `GET /sessions-over-time`
   - Returns array of `{label, value}` representing sessions per date/week/month.
   - Example: `/api/v1/stats/sessions-over-time?granularity=weekly`

2. `GET /revenue-over-time`
   - Returns revenue per date/week/month.

3. `GET /energy-consumption`
   - Returns total energy (grid + solar) consumed per date/week/month.

4. `GET /soc-trends?carId=<id>`
   - Requires `carId` query param. Returns average SoC per date.

5. `GET /payments-by-mode`
   - Returns totals grouped by payment mode (CARD, UPI, WALLET, etc.).

Examples (curl):
```
curl -H "token: <JWT>" "http://localhost:3000/api/v1/stats/sessions-over-time?granularity=daily"

curl -H "token: <JWT>" "http://localhost:3000/api/v1/stats/revenue-over-time?startDate=2025-11-01&endDate=2025-12-01"
```

Notes:
- If you want Chart.js style `{ labels, datasets }` instead of `{label,value}` I can add a `format=chartjs` flag.
- `energy-consumption` depends on `EnergyUsage` and `SolarUsage` records for charging stations used by the user's bookings. Run `npm run seed` to populate sample data in dev.
