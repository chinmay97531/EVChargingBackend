# EV Parking + Charging Station Backend

A production-grade backend API for an EV Parking and Charging Station platform built with Node.js, Express, TypeScript, and Prisma (PostgreSQL).

## 🏗️ Architecture

This backend follows **clean architecture principles** with a modular structure:

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/   # Data access layer
├── routes/          # API route definitions
├── middleware/      # Auth, validation, error handling
├── dto/             # Data Transfer Objects (validation schemas)
├── utils/           # Utility functions
└── types/           # TypeScript type definitions
```

## 🚀 Features

- ✅ RESTful API design
- ✅ JWT-based authentication
- ✅ DTO validation with Zod
- ✅ Clean service-controller-repository architecture
- ✅ Error handling middleware
- ✅ Battery SOC/SOH tracking with timestamps
- ✅ Payment management with savings tracking
- ✅ Comprehensive statistics (numerical + graphical)
- ✅ Chart.js/Recharts compatible data format

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/evparking?schema=public"
JWT_SECRET="your-secret-key-here"
OPEN_CHARGE_MAPS_API_KEY="your-api-key-here"
PORT=3000
```

### 3. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (creates database schema)
npm run prisma:migrate

# Or for production
npm run prisma:migrate:deploy
```

### 4. Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

This will create:
- Sample users
- Cars with battery history
- Charging stations
- Bookings
- Payments
- Energy usage records

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## 📡 API Endpoints

### Authentication

- `POST /api/v1/signup` - User registration
- `POST /api/v1/signin` - User login (returns JWT token)

### Battery Management

- `GET /api/v1/battery/status?carId={carId}` - Get current battery SOC, SOH, and timestamp
  - **Query Parameters:**
    - `carId` (optional): Specific car ID. If not provided, returns first car for user.
  - **Response:**
    ```json
    {
      "success": true,
      "message": "Battery status retrieved successfully",
      "data": {
        "carId": 1,
        "carName": "Tesla Model 3",
        "carModel": "2023",
        "soc": 45.5,
        "soh": 95.5,
        "timestamp": "2024-01-15T10:30:00.000Z",
        "date": "2024-01-15"
      }
    }
    ```

### Payment Management

- `GET /api/v1/payment/data?startDate={date}&endDate={date}` - Get payment data
  - **Query Parameters:**
    - `startDate` (optional): Filter start date (ISO format)
    - `endDate` (optional): Filter end date (ISO format)
  - **Response:**
    ```json
    {
      "success": true,
      "message": "Payment data retrieved successfully",
      "data": {
        "totalPaid": 1000.0,
        "totalSavings": 130.0,
        "totalPayments": 3,
        "paymentRecords": [
          {
            "id": 1,
            "bookingId": 1,
            "amount": 450.0,
            "originalAmount": 500.0,
            "savings": 50.0,
            "paymentMode": "UPI",
            "status": "SUCCESS",
            "createdAt": "2024-01-15T10:30:00.000Z"
          }
        ]
      }
    }
    ```

### Statistics

- `GET /api/v1/statistics?carId={carId}&startDate={date}&endDate={date}` - Get comprehensive statistics
  - **Query Parameters:**
    - `carId` (optional): Specific car ID for SOC trends
    - `startDate` (optional): Filter start date (ISO format)
    - `endDate` (optional): Filter end date (ISO format)
  - **Response:**
    ```json
    {
      "success": true,
      "message": "Statistics retrieved successfully",
      "data": {
        "numerical": {
          "totalChargingSessions": 10,
          "completedSessions": 8,
          "cancelledSessions": 1,
          "totalAmountPaid": 1000.0,
          "totalSavings": 130.0,
          "averageSessionDuration": 120.5,
          "totalEnergyConsumed": 500.0
        },
        "graphical": {
          "socTrends": {
            "labels": ["2024-01-01", "2024-01-02", ...],
            "datasets": [
              {
                "label": "State of Charge (%)",
                "data": [45.5, 47.2, ...]
              }
            ]
          },
          "chargingSessionsOverTime": {
            "labels": ["2024-01-01", "2024-01-02", ...],
            "datasets": [
              {
                "label": "Charging Sessions",
                "data": [2, 3, ...]
              }
            ]
          },
          "revenueTrends": {
            "labels": ["2024-01-01", "2024-01-02", ...],
            "datasets": [
              {
                "label": "Revenue (₹)",
                "data": [450.0, 300.0, ...]
              }
            ]
          },
          "energyConsumption": {
            "labels": ["2024-01-01", "2024-01-02", ...],
            "datasets": [
              {
                "label": "Grid Electricity (kWh)",
                "data": [25.5, 30.2, ...]
              },
              {
                "label": "Solar Power (kWh)",
                "data": [20.0, 22.5, ...]
              },
              {
                "label": "Total Energy (kWh)",
                "data": [45.5, 52.7, ...]
              }
            ]
          }
        }
      }
    }
    ```

### Car Management

- `DELETE /api/v1/cars/:carId` - Delete car by ID
  - **Path Parameters:**
    - `carId`: Car ID to delete
  - **Response:**
    ```json
    {
      "success": true,
      "message": "Car deleted successfully",
      "data": {
        "message": "Car deleted successfully"
      }
    }
    ```

## 🔐 Authentication

All protected endpoints require a JWT token in the request header:

```
token: <your-jwt-token>
```

Or using Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

Key models:
- **User**: User accounts with authentication
- **Car**: Vehicle information with battery details
- **BatteryHistory**: Historical SOC/SOH tracking with timestamps
- **ChargingStation**: Charging station information
- **Booking**: Charging session bookings
- **Payment**: Payment records with savings tracking
- **EnergyUsage**: Grid electricity consumption
- **SolarUsage**: Solar power generation

## 🧪 Testing the API

### 1. Sign Up

```bash
curl -X POST http://localhost:3000/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Sign In

```bash
curl -X POST http://localhost:3000/api/v1/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from the response.

### 3. Get Battery Status

```bash
curl -X GET "http://localhost:3000/api/v1/battery/status?carId=1" \
  -H "token: <your-jwt-token>"
```

### 4. Get Payment Data

```bash
curl -X GET "http://localhost:3000/api/v1/payment/data" \
  -H "token: <your-jwt-token>"
```

### 5. Get Statistics

```bash
curl -X GET "http://localhost:3000/api/v1/statistics?carId=1" \
  -H "token: <your-jwt-token>"
```

### 6. Delete Car

```bash
curl -X DELETE "http://localhost:3000/api/v1/cars/1" \
  -H "token: <your-jwt-token>"
```

## 📈 Frontend Integration

The statistics endpoints return data in a format compatible with popular charting libraries:

### Chart.js Example

```javascript
const response = await fetch('/api/v1/statistics', {
  headers: { 'token': jwtToken }
});
const { data } = await response.json();

// Use directly with Chart.js
const chartData = {
  labels: data.graphical.socTrends.labels,
  datasets: data.graphical.socTrends.datasets
};

new Chart(ctx, {
  type: 'line',
  data: chartData
});
```

### Recharts Example

```javascript
const response = await fetch('/api/v1/statistics', {
  headers: { 'token': jwtToken }
});
const { data } = await response.json();

// Transform for Recharts
const chartData = data.graphical.socTrends.labels.map((label, index) => ({
  date: label,
  soc: data.graphical.socTrends.datasets[0].data[index]
}));

<LineChart data={chartData}>
  <Line dataKey="soc" />
  <XAxis dataKey="date" />
  <YAxis />
</LineChart>
```

## 🛠️ Development

### Project Structure

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Repositories**: Handle database operations
- **DTOs**: Validate request data using Zod
- **Middleware**: Authentication, validation, error handling
- **Routes**: Define API endpoints

### Adding New Features

1. Create DTO in `src/dto/`
2. Create repository in `src/repositories/`
3. Create service in `src/services/`
4. Create controller in `src/controllers/`
5. Add route in `src/routes/`
6. Register route in `src/routes/index.ts`

## 📝 Notes

- All timestamps are in ISO 8601 format
- Dates in query parameters should be in ISO format (YYYY-MM-DD or full ISO string)
- Error responses follow a consistent format with `success: false`
- The seed script creates sample data for testing

## 📚 Full API Reference

This section lists all implemented endpoints (grouped) and example requests/responses. Use the JWT `token` header for protected endpoints.

Auth
- `POST /api/v1/signup` — Body: `{ username, email, password }`
- `POST /api/v1/signin` — Body: `{ email, password }` — Returns `{ data: { token } }`

User
- `POST /api/v1/getUserDetails` — returns `{ id, username, email }`
- `POST /api/v1/updateUserName` — Body: `{ username }`
- `POST /api/v1/updateUserPassword` — Body: `{ oldPassword, newPassword }`

Cars
- `POST /api/v1/insertCarData` — Insert car. Body fields: `carName, carModel, carNumber, currentBattreyHealth, capacityOfBattrey, typeOfPort, FastAndSlow, currentBattreyStatus`
- `POST /api/v1/getCarDetails` — Get cars for user
- `POST /api/v1/deleteCarDetails` — Body: `{ carId }` (alternatively `DELETE /api/v1/cars/:carId`)

Charging Stations
- `POST /api/v1/nearestEVStation` — Body: `{ lat, long }`
- `POST /api/v1/getStationDetails` — Body: `{ stationName }`
- `POST /api/v1/getStationDetailsByPostCode` — Body: `{ pinCode }`
- `POST /api/v1/getStationDetailsByCity` — Body: `{ cityName }`

Bookings
- `POST /api/v1/booking` — Body: `{ lat, long }` — Creates a booking using user's car; returns booking record
- `POST /api/v1/getChargingSessions` — Body: `{}` — Returns user's bookings (includes `chargingStation`)
- `POST /api/v1/cancelBooking` — Body: `{ bookingId }`
- `POST /api/v1/completeBooking` — Body: `{ bookingId }`

Payment
- `POST /api/v1/payment` — Body: `{ bookingId, amount, paymentMode }` — paymentMode one of `CARD|UPI|NET_BANKING|CASH|WALLET`
- `GET /api/v1/payment/data` — Query params: `startDate,endDate`

Statistics
The project provides two statistics route groups:

- `GET /api/v1/statistics` — Returns a combined `numerical` and `graphical` payload used by the frontend charts. Query params: `carId, startDate, endDate`.
- `GET /api/v1/stats/*` — Lightweight, chart-friendly endpoints returning arrays of `{ label, value }`:
  - `/api/v1/stats/sessions-over-time` — Query: `startDate,endDate,granularity`
  - `/api/v1/stats/revenue-over-time` — Query: `startDate,endDate,granularity`
  - `/api/v1/stats/energy-consumption` — Query: `startDate,endDate,granularity`
  - `/api/v1/stats/soc-trends?carId={id}` — Query: `startDate,endDate`
  - `/api/v1/stats/payments-by-mode` — Query: `startDate,endDate`

Examples

Insert car:
```bash
curl -X POST http://localhost:3000/api/v1/insertCarData \
  -H 'Content-Type: application/json' \
  -H 'token: <JWT>' \
  -d '{"carName":"Tesla Model 3","carModel":"2024","carNumber":"TM001","currentBattreyHealth":95.5,"capacityOfBattrey":75,"typeOfPort":"Type2","FastAndSlow":"fast","currentBattreyStatus":30 }'
```

Create booking (returns booking id):
```bash
curl -X POST http://localhost:3000/api/v1/booking \
  -H 'Content-Type: application/json' \
  -H 'token: <JWT>' \
  -d '{"lat":30.3564, "long":76.3647 }'
```

Get chart-friendly sessions:
```bash
curl -X GET "http://localhost:3000/api/v1/stats/sessions-over-time?granularity=daily" -H "token: <JWT>"
```

Notes
- Use `npm run seed` to populate the database with sample users, cars, stations, bookings, payments and energy data for development/testing.
- All endpoints follow the common response format: `{ success: boolean, message: string, data?: any }`.

## 🔒 Security

- Passwords are hashed using bcrypt
- JWT tokens expire (configure in JWT_SECRET)
- Input validation using Zod schemas
- SQL injection protection via Prisma

## 📄 License

ISC

