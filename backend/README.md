# FleetOS+ Backend — ASP.NET Core 8 Web API

## Prerequisites
- .NET 8 SDK — https://dotnet.microsoft.com/download/dotnet/8.0
- PostgreSQL 15+ running locally

## Quick start
```bash
# 1. Update connection string in appsettings.json if needed
# 2. Restore and run
dotnet restore
dotnet run
# API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

## Seed accounts (all use password: Demo1234!)
| Email | Role |
|---|---|
| super@fleetosteam.io | super_admin |
| admin@acme.io | fleet_admin |
| dispatch@acme.io | dispatcher |
| viewer@acme.io | viewer |

## API endpoints
| Method | Path | Auth |
|---|---|---|
| POST | /api/v1/auth/login | public |
| POST | /api/v1/auth/register | public |
| GET | /api/v1/dashboard/summary | JWT |
| GET | /api/v1/vehicles | JWT |
| POST | /api/v1/vehicles | fleet_admin+ |
| PUT | /api/v1/vehicles/{id} | fleet_admin+ |
| DELETE | /api/v1/vehicles/{id} | fleet_admin |
| GET | /api/v1/drivers | JWT |
| POST | /api/v1/drivers | fleet_admin+ |
| DELETE | /api/v1/drivers/{id} | fleet_admin |
