# RBAC System

A full-stack Role-Based Access Control system built with NestJS, Next.js, and PostgreSQL.

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | NestJS (Node.js), TypeORM |
| Database | PostgreSQL |
| Deployment | Docker |

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- npm (package manager)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ArmanHFahim/simple-rbac.git

cd rbac
```

### 2. Environment Configuration

Create environment files for backend and frontend:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

### 3. Docker Setup (Recommended)

Start the entire application stack with Docker Compose:

```bash
docker compose up -d --build
```

This will start:

- PostgreSQL database on port 5432
- NestJS backend on port 4000
- Next.js frontend on port 3000

### 4. Local Development Setup (Alternative)

#### Backend Setup

```bash
cd backend

npm install

npm run start:dev
```

#### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

#### Database Seed

```bash
cd backend

npm run seed
```

**Note:** For local development, ensure you use `localhost` in your environment variables for database connections instead of Docker service names.

## 🐳 Docker Commands

```bash
# Build and start all services
docker compose up -d --build

# Stop all services
docker compose down

# View logs
docker compose logs -f
```

## 📝 Features

- User authentication with JWT and refresh tokens
- User management with role assignment
- Role and permission management
- Team organization
- Project management
- Task tracking
- Document management
- Audit logging
- Dashboard with analytics
