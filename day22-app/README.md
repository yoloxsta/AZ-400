# Day 22 Demo Application

A simple Flask REST API for demonstrating AKS deployment with Traefik ingress and authentication.

## Features

- RESTful API with multiple endpoints
- Health check endpoint
- Environment-aware configuration
- Production-ready with Gunicorn
- Docker containerized
- Kubernetes ready

## Endpoints

### Public Endpoints
- `GET /` - API information
- `GET /health` - Health check

### Protected Endpoints (Require Authentication)
- `GET /api/info` - API details
- `GET /api/users` - List users
- `GET /api/products` - List products
- `GET /api/stats` - API statistics

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run application
python app.py

# Test
curl http://localhost:5000
curl http://localhost:5000/health
curl http://localhost:5000/api/users
```

## Docker Build

```bash
# Build image
docker build -t day22-demo-api:1.0.0 .

# Run container
docker run -p 5000:5000 -e APP_VERSION=1.0.0 -e ENVIRONMENT=development day22-demo-api:1.0.0

# Test
curl http://localhost:5000
```

## Environment Variables

- `APP_VERSION` - Application version (default: 1.0.0)
- `ENVIRONMENT` - Environment name (default: production)

## Authentication

When deployed with Traefik, all `/api/*` endpoints are protected with BasicAuth.

Default credentials (configured in Traefik):
- Username: `admin`
- Password: `secure123`

## Health Check

The application includes a health check endpoint at `/health` that returns:
```json
{
  "status": "healthy",
  "hostname": "pod-name",
  "version": "1.0.0"
}
```
