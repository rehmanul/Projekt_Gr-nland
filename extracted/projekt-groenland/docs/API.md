# API Documentation

## Base URL
`http://localhost:4000/api/v1`

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "employer"
  }
}
```

## Jobs

### List Jobs
```http
GET /jobs?location=Baden&employment_type=full_time
```

### Create Job
```http
POST /jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Software Developer",
  "description": "We are looking for...",
  "location": "Baden-Baden",
  "employment_type": "full_time",
  "salary_min": 50000,
  "salary_max": 70000
}
```

## Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
