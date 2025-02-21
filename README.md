# Task Manager Backend

This is a simple Task Management backend built with Node.js, Express, TypeScript, and PostgreSQL. It supports user registration, login (using bcrypt for password hashing and JWT for authentication), and CRUD operations for tasks. 
## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Notes](#notes)

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [PostgreSQL](https://www.postgresql.org/) database

## Installation

1. Clone the repository and navigate to the project folder:

   ```bash
   git clone https://github.com/Zhdddd7/lumaa-spring-2025-swe
   cd task-manager-backend
   ```
2. Install the dependencies:

   ```bash
   npm install
   ```
3. Create a .env file in the project root (next to package.json and tsconfig.json) with the following content:
    ```bash
    PORT=5000
    DATABASE_URL=postgresql://<your-user-name>:<password>@localhost:5432/<your-db-name>
    JWT_SECRET=your_jwt_secret
   ```

## Database Setup
Create your db(the command may be different depends on your database tools) and migrate the database table through the migration.sql
here is an example:
  ```
  createdb lumaa
  psql -d lumaa -f migration.sql
  ```
## Launch the Backend
1. (Optional)Now you are already in the backend folder, so you can compile the ts files, but this is not necessary since I will provide the compiled file as well

   ```bash
   npx tsc -p tsconfig.json
   ```
2. Run Backend
    ```bash
   node dist/server.js
   ```
## Launch the Frontend
1. go to the frontend folder
    ```bash
   cd task-manager-frontend
   ```
2. Install the dependencies:

   ```bash
   npm install
   ```
3. Launch the frontend:
    ```bash
   npm start
   ```
Now go to http://localhost:3000 to see the website!
  
