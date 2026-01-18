# Work Order App

A robust fullstack application designed to manage work orders, maintenance tasks, and spare parts inventory requests. This system handles logic for user management, task assignments, and approval workflows.

## Description
This repository is a monorepo containing:
- **`backend-work-order`**: A NestJS-based REST API that serves as the core handling logic, database interactions, and business rules.
- **`frontend-work-order`**: A Next.js frontend application (work in progress) for interacting with the system.

## Tech Stack

### Backend
- **Framework:** [NestJS](https://nestjs.com/) (v11)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (v15 via Docker)
- **ORM:** [Prisma](https://www.prisma.io/) (v5.22)
- **Containerization:** [Docker](https://www.docker.com/)

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) (v16) with App Router
- **Library:** React (v19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
- **Language:** TypeScript

## Features Implemented

### 1. Work Order Management
- **Create & Submit Work Order**: Admins can create and submit new work orders.
- **Assign Mechanic**: Supervisors (SPV) can assign mechanics to submitted orders.
- **Start Working**: Mechanics can signal that they have started working on an assigned order.
- **Update Details**: Admins can update descriptions and details.
- **Complete Work Order**: Admins can mark orders as completed.

### 2. Sparepart Requests
- **Request Spareparts**: Admins can request parts linked to a specific Work Order.
- **Approve/Reject Requests**: Supervisors (SPV) review and approve spare part requests.

## API Endpoints

### Work Orders
| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/work-orders` | Create a new Work Order | `{ title, description, created_by }` |
| `POST` | `/work-orders/:id/submit` | Submit WO (Status: OPEN -> SUBMITTED) | - |
| `POST` | `/work-orders/:id/update` | Update WO Details | `{ title, description, end_date }` |
| `POST` | `/work-orders/:id/assign` | Assign Mechanic | `{ mechanic_id }` |
| `POST` | `/work-orders/:id/start` | Start Working (Status: ASSIGNED -> WORKING) | - |
| `POST` | `/work-orders/:id/complete` | Complete WO | `{ end_date }` (Optional) |

### Sparepart Requests
| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/sparepart-requests` | Create Request | `{ work_order_id, requested_by, items: [{name, qty}] }` |
| `POST` | `/sparepart-requests/:id/approve` | Approve Request | `{ approver_id }` |

## Quick Start (Docker Compose)
This is the recommended way to run the application as per requirements.

1. **Clone the repository** (if not already done).
2. **Run via Docker Compose**:
   ```bash
   docker compose up --build
   ```
3. **Access the Application**:
   - Frontend: [http://localhost:3001](http://localhost:3001)
   - Backend API: [http://localhost:3000](http://localhost:3000)
   - Database: localhost:5433

The database will be automatically seeded with:
- **Admin**: `d855734e-4f25-4f46-9d35-364233777701`
- **SPV**: `d855734e-4f25-4f46-9d35-364233777702`
- **Mechanic**: `d855734e-4f25-4f46-9d35-364233777703`

## Project Structure
```
root/
├── backend-work-order/       # NestJS Backend
│   ├── src/
│   │   ├── modules/          # Feature modules (work-order, users, sparepart)
│   │   ├── common/           # Shared enums, filters
│   │   ├── prisma/           # Database schema & client
│   │   └── main.ts           # Entry point
│   ├── Dockerfile            # Backend container config
│   └── ...
├── frontend-work-order/      # Next.js Frontend
│   ├── app/                  # App Router pages
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API services (workOrderService)
│   │   └── types/            # TypeScript interfaces
│   ├── Dockerfile            # Frontend container config
│   └── ...
├── docker-compose.yml        # Orchestration for FE, BE, DB
└── README.md                 # Documentation
```

## Local Development (Manual Setup)

### 1. Setup Backend & Database

1.  **Navigate to the backend directory**:
    ```bash
    cd backend-work-order
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Database Setup**:
    Start the PostgreSQL container (exposed on port **5433**):
    ```bash
    docker-compose up -d
    ```

4.  **Configure Environment Variables**:
    Ensure `.env` exists in `backend-work-order/` with:
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5433/workorder_db?schema=public"
    ```

5.  **Generate Prisma Client** (Important!):
    ```bash
    npx prisma generate
    ```

6.  **Database Migration & Seeding**:
    Apply migrations and seed the database.
    ```bash
    npx prisma migrate dev --name init
    
    # Seed data using SQL (Recommended method for Windows PowerShell)
    type prisma\seed.sql | docker exec -i workorder_postgres psql -U postgres -d workorder_db
    ```

7.  **Run Application**:
    ```bash
    npm run start:dev
    ```
    The backend API will run on `http://localhost:3000`.

### 2. Setup Frontend

1.  **Navigate to the frontend directory**:
    ```bash
    cd ../frontend-work-order
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The frontend will run on `http://localhost:3001` (or 3000 if available).

## Postman Testing
Import `work-order-api.postman_collection.json` (located in backend folder) to verify all endpoints. See `backend-work-order/TESTING_GUIDE.md` for details.

## Assumptions & Design
1.  **Authentication Simulation**: The backend currently uses simple ID headers (e.g., `x-user-id`) for identifying users and roles (ADMIN, SPV, MECHANIC) to facilitate easy testing without complex auth flows.
2.  **Workflow**: Statuses transition strictly: `OPEN` -> `SUBMITTED` -> `WORKING` -> `COMPLETED`.
3.  **Database Port**: Uses port **5433** to avoid conflict with local defaults.
