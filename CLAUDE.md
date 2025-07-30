# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Vibe Seat Backend** - a TypeScript/Express.js API for managing massage chair appointments with role-based access control. Built with Bun runtime, Prisma ORM, MySQL, and Docker containerization.

## Development Commands

### Essential Commands

```bash
# Start development environment (builds and runs in Docker)
bun run start:docker

# Database operations
bun run prisma:generate     # Generate Prisma client
bun run prisma:migrate      # Run database migrations
bun run prisma:studio       # Open Prisma Studio (DB GUI)
bun run seed:admin          # Seed admin user

# Code formatting
bun run format              # Format code with Prettier
bun run format:check        # Check code formatting

# Performance testing
bun run test:performance    # Run Artillery performance tests
```

### Docker Commands

```bash
# Common Docker operations
docker exec backend-app-1 bun run seed:admin
docker exec backend-app-1 bun run prisma:migrate
docker exec -it backend-app-1 bash
docker exec -it backend-db-1 mysql -u root -proot

# Timezone configuration (set in docker-compose.yml)
# TIMEZONE=America/Rio_Branco (default)
# TZ=America/Rio_Branco (alternative)
```

## Architecture

### Module Structure

The codebase follows a modular architecture in `src/modules/`:

- **auth** - Authentication and JWT handling
- **user** - User management and registration
- **role** - Role-based access control
- **approval** - User approval workflow
- **chair** - Massage chair management
- **schedule** - Global scheduling configuration
- **dayOfWeek** - Day-of-week schedule settings
- **appointment** - Appointment booking and management
- **email** - Email automation and logging system
- **dashboard** - Analytics and overview data

Each module contains:

- `*.controller.ts` - Request/response handling
- `*.service.ts` - Business logic
- `*.repository.ts` - Database operations
- `*.routes.ts` - Route definitions
- `types.ts` - TypeScript type definitions

### Key Models

- **User** - Users with role-based permissions and approval status
- **Role** - Permission levels (admin, user, etc.)
- **UserApproval** - Approval workflow for user registration
- **Chair** - Physical massage chairs with status (ACTIVE/MAINTENANCE/INACTIVE)
- **ScheduleConfig** - Global singleton for schedule configuration with JSON time ranges
- **DayOfWeek** - Available days linked to schedule config
- **Appointment** - Bookings with status (SCHEDULED/CANCELLED/CONFIRMED)
- **EmailLog** - Email tracking system for appointment-related communications

### Database

- **Provider**: MySQL via Prisma ORM
- **Connection**: Configured in docker-compose.yml
- **Migrations**: Located in `prisma/migrations/`
- **Schema**: `prisma/schema.prisma`
- **Timezone**: Centralized configuration via TIMEZONE environment variable

### Key Features

- JWT-based authentication with hierarchical role-based access
- User registration with approval workflow
- Global schedule configuration with flexible time ranges
- Chair availability and appointment management
- Automated email system with comprehensive logging
- Soft deletes on all models (createdAt, updatedAt, deletedAt)

### Permission Hierarchy

**user < attendant < admin**

**User (user role):**

- Create and cancel own appointments (max 1 active appointment)
- View available appointment times
- View available chairs and schedules

**Attendant (attendant role):**

- All user permissions
- Approve/reject user registrations
- View and manage all appointments
- Confirm user presence for sessions
- View dashboard analytics

**Administrator (admin role):**

- All attendant permissions
- Approve attendant registrations
- Manage chairs (create, edit, delete)
- Configure schedules and available days
- Manage roles and system configuration

### Business Rules

**Appointment Management:**

- Users can have only 1 active appointment at a time (SCHEDULED or CONFIRMED status)
- To create a new appointment, existing appointments must be CANCELLED or completed (past date)
- Appointments require 3h minimum cancellation notice (except for admins)
- 30-minute appointment duration
- Appointments only allowed within configured schedule hours and days

**User Registration:**

- Required fields: Nome completo, CPF, Função, Cargo, Matrícula, Setor, E-mail, Telefone, Sexo, Data de nascimento, Tipo de usuário
- Unique constraints: username, cpf, email, registration
- Automatic validation for email format, CPF format, gender values
- Search functionality across all user fields

**User Approval:**

- All users require approval before accessing protected resources
- Only approved users can make appointments or access system features
- Attendants approve user registrations, admins approve attendant registrations

## Development Workflow

1. **Database Changes**: Update `prisma/schema.prisma`, then run `bunx prisma migrate dev --name migration-name`
2. **New Features**: Follow the modular pattern - create controller, service, repository, routes, and types
3. **Docker Development**: Use `bun run start:docker` for consistent environment
4. **Testing**: Performance tests available via Artillery in `tests/performance/`

## Important Notes

- **Environment**: Use Docker for development (no local .env needed)
- **Database URL**: Auto-configured in docker-compose.yml
- **Port**: Application runs on port 3001
- **Runtime**: Uses Bun instead of Node.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT tokens for API access
- **Path Mapping**: Uses `@/` alias for `src/` directory
- **Timezone**: Centralized configuration via TIMEZONE environment variable
  - Default: `America/Rio_Branco` (UTC-5)
  - Affects: appointments, emails, cron jobs, logs
  - **No .env files needed** - all configuration in docker-compose.yml
  - Cron jobs are automatically restarted when Docker containers restart
