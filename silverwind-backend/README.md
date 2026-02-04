# Solventek Vendor Portal Backend

Spring Boot backend for Solventek's Vendor/Client/Employee management portal.

## Tech Stack

- **Java 21**
- **Spring Boot 3.3.0**
- **Spring AI 1.0.0-M1** (Google Gemini + PgVector)
- **PostgreSQL 16** (with pgvector extension)
- **Flyway** Migrations
- **Spring Security** (JWT + Stateful RBAC)

## Prerequisites

1. Docker Desktop
2. Java 21 SDK
3. Google Gemini API Key

## Setup

1. **Environment Variables**
   Set the following env vars in IntelliJ or your shell:

   ```bash
   export GEMINI_API_KEY="your-google-api-key"
   export JWT_SECRET="your-256-bit-secret"
   ```

2. **Start Database**

   ```bash
   docker-compose up -d
   ```

3. **Run Application**
   ```bash
   mvn spring-boot:run
   ```
   The app will start on `http://localhost:8080`.
   Flyway will automatically create tables and the `vector` extension.
   `DataSeeder` will create the initial `Solventek` organization and `SUPER_ADMIN` role.

## API Documentation

Swagger UI is available (if dependency included) or use Postman.
Key endpoints:

- `POST /api/auth/login`
- `POST /api/auth/register-vendor`
- `GET /api/jobs`
- `POST /api/ai/jobs/{id}/enrich`

## AI Features

- **Resume Ingestion**: Uploads PDF, splits text, and stores embeddings in Postgres `vector_store`.
- **Job Enrichment**: Uses Gemini Pro to improve job descriptions.
- **Matching**: Semantic search between Job description and Candidate resumes.

## Security

- All endpoints secured with JWT.
- RBAC implemented via `User` -> `Role` -> `Permission`.
- Organization-level data isolation enforced in Services.
