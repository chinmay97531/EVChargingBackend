# API Reference Guide

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All protected endpoints require a JWT token in the header:
```
token: <jwt-token>
```
or
```
Authorization: Bearer <jwt-token>
```

---

## Endpoints

### 1. Battery Status
**GET** `/battery/status`

Get current battery SOC (State of Charge), SOH (State of Health), and timestamp.

**Query Parameters:**
- `carId` (optional): Specific car ID. If omitted, returns first car for user.

**Response:**
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

---

### 2. Payment Data
**GET** `/payment/data`

Get payment information including total paid, total savings, and all payment records.

**Query Parameters:**
- `startDate` (optional): Filter start date (ISO format: YYYY-MM-DD)
- `endDate` (optional): Filter end date (ISO format: YYYY-MM-DD)

**Response:**
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

---

### 3. Statistics
**GET** `/statistics`

Get comprehensive numerical statistics and graphical datasets for charts.

**Query Parameters:**
- `carId` (optional): Specific car ID for SOC trends
- `startDate` (optional): Filter start date (ISO format: YYYY-MM-DD)
- `endDate` (optional): Filter end date (ISO format: YYYY-MM-DD)

**Response:**
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
        "labels": ["2024-01-01", "2024-01-02", "2024-01-03"],
        "datasets": [
          {
            "label": "State of Charge (%)",
            "data": [45.5, 47.2, 49.1]
          }
        ]
      },
      "chargingSessionsOverTime": {
        "labels": ["2024-01-01", "2024-01-02", "2024-01-03"],
        "datasets": [
          {
            "label": "Charging Sessions",
            "data": [2, 3, 1]
          }
        ]
      },
      "revenueTrends": {
        "labels": ["2024-01-01", "2024-01-02", "2024-01-03"],
        "datasets": [
          {
            "label": "Revenue (₹)",
            "data": [450.0, 300.0, 250.0]
          }
        ]
      },
      "energyConsumption": {
        "labels": ["2024-01-01", "2024-01-02", "2024-01-03"],
        "datasets": [
          {
            "label": "Grid Electricity (kWh)",
            "data": [25.5, 30.2, 28.1]
          },
          {
            "label": "Solar Power (kWh)",
            "data": [20.0, 22.5, 21.3]
          },
          {
            "label": "Total Energy (kWh)",
            "data": [45.5, 52.7, 49.4]
          }
        ]
      }
    }
  }
}
```

**Graphical Data Format:**
All graphical datasets are formatted for direct use with Chart.js or Recharts:
- `labels`: Array of date strings
- `datasets`: Array of dataset objects with `label` and `data` arrays

---

### 4. Delete Car
**DELETE** `/cars/:carId`

Delete a car by its ID.

**Path Parameters:**
- `carId`: Car ID to delete (integer)

**Response:**
```json
{
  "success": true,
  "message": "Car deleted successfully",
  "data": {
    "message": "Car deleted successfully"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Car not found",
  "error": null
}
```

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information (optional)"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Example Usage

### Using cURL

```bash
# Get battery status
curl -X GET "http://localhost:3000/api/v1/battery/status?carId=1" \
  -H "token: your-jwt-token"

# Get payment data with date range
curl -X GET "http://localhost:3000/api/v1/payment/data?startDate=2024-01-01&endDate=2024-01-31" \
  -H "token: your-jwt-token"

# Get statistics
curl -X GET "http://localhost:3000/api/v1/statistics?carId=1&startDate=2024-01-01" \
  -H "token: your-jwt-token"

# Delete car
curl -X DELETE "http://localhost:3000/api/v1/cars/1" \
  -H "token: your-jwt-token"
```

### Using JavaScript/Fetch

```javascript
const token = 'your-jwt-token';

// Get battery status
const batteryResponse = await fetch('http://localhost:3000/api/v1/battery/status?carId=1', {
  headers: { 'token': token }
});
const batteryData = await batteryResponse.json();

// Get statistics
const statsResponse = await fetch('http://localhost:3000/api/v1/statistics?carId=1', {
  headers: { 'token': token }
});
const statsData = await statsResponse.json();

// Use with Chart.js
const chartData = {
  labels: statsData.data.graphical.socTrends.labels,
  datasets: statsData.data.graphical.socTrends.datasets
};
```

---

## Notes

1. All dates should be in ISO 8601 format (YYYY-MM-DD or full ISO string)
2. Timestamps are returned in ISO 8601 format
3. All monetary values are in the base currency (configure as needed)
4. Energy values are in kWh
5. Duration values are in minutes

