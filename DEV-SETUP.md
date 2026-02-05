# Local Development Setup Guide

This guide explains how to run the Silverwind application locally without Docker or Jenkins.

## Prerequisites

Ensure you have the following installed on your machine:

- **Java 21** (Required for Spring Boot Backend)
- **Node.js 20+** (Required for Angular Frontend)
- **PostgreSQL 14+** (Required for Database)

## Database Setup

1.  **Install PostgreSQL**: If you haven't already, install PostgreSQL.
2.  **Create Database**:
    ```bash
    createdb silverwind
    ```
3.  **Configure Credentials**:
    The backend expects the following credentials by default:
    - **Host**: `localhost`
    - **Port**: `5432`
    - **Database**: `silverwind`
    - **Username**: `postgres`
    - **Password**: `8080`

    If your local credentials differ, modify the file:
    `silverwind-backend/src/main/resources/application.properties`

    Find these lines and update them:

    ```properties
    spring.datasource.username=your_username
    spring.datasource.password=your_password
    ```

    > **Note**: The application uses Flyway for migrations, so tables will be created automatically on the first run.

## Backend Setup (Spring Boot)

1.  Navigate to the backend directory:

    ```bash
    cd silverwind-backend
    ```

2.  Run the application using the Maven wrapper:
    - **Mac/Linux**:
      ```bash
      ./mvnw spring-boot:run
      ```
    - **Windows**:
      ```cmd
      mvnw.cmd spring-boot:run
      ```

3.  The backend server will start on **port 9090**.
    - API Health Check: [http://localhost:9090/actuator/health](http://localhost:9090/actuator/health)

## Frontend Setup (Angular)

1.  Navigate to the frontend directory:

    ```bash
    cd silverwind-frontend
    ```

2.  Install dependencies (first time only):

    ```bash
    npm install
    ```

3.  Start the development server:

    ```bash
    npm start
    ```

    (This runs `ng serve` with the development configuration).

4.  The application will be available at [http://localhost:4200](http://localhost:4200).
    - API calls to `/api` are automatically proxied to `http://localhost:9090` via `proxy.conf.dev.json`.

## Troubleshooting

- **Backend Port Conflict**: If port 9090 is in use, change `server.port` in `application.properties`. Remember to update `frontend/proxy.conf.dev.json` as well.
- **Database Connection Refused**: Ensure PostgreSQL is running and credentials are correct.
- **CORS Issues**: The proxy setup in `proxy.conf.dev.json` handles local CORS issues. Ensure you are accessing the app via `http://localhost:4200`, not `localhost:9090` directly for frontend assets.
