# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated:** July 24, 2025

## Development Commands

### Backend (Node.js/Express)
- `cd backend && npm run dev` - Start backend development server with nodemon
- `cd backend && npm start` - Start backend production server
- `cd backend && npm test` - Run Jest tests
- `cd backend && npm install` - Install backend dependencies

### Frontend (React)
- `cd frontend && npm start` - Start React development server (port 3000)
- `cd frontend && npm run build` - Build for production
- `cd frontend && npm test` - Run React tests
- `cd frontend && npm install` - Install frontend dependencies

### Environment Setup
- Copy `backend/.env.example` to `backend/.env` and configure PostgreSQL credentials, JWT secret, and email settings
- Run PostgreSQL schema: `psql -U postgres -d event_ticketing -f backend/database/schema.sql`
- Backend runs on port 5002, frontend on port 3002 by default

## Architecture Overview

This is a full-stack request management system with separate backend and frontend applications. **Note: The system has been migrated from a ticket-based system to a request-based system as of July 2025.**

### Backend Architecture (Node.js/Express/PostgreSQL)

**Core Models (Sequelize/PostgreSQL):**
- `User` - Authentication with role-based access (client/employee/lead/admin)
- `Request` - Main entity with auto-generated request numbers (REQ-XXXXXX format), status tracking, and department assignment
- `EventRequest` - Event-specific request details with graphics, equipment, and ticket requirements
- `WebRequest` - Web development request details
- `TechnicalRequest` - Technical support issue descriptions
- `GraphicRequest` - Graphic design request specifications
- `RequestActivity` - Activity log for status changes, comments, and time tracking
- `Department` - Department management with leads and employees
- `Notification` - In-app and email notifications for request updates
- `TechActivity` - Technical activity tracking (legacy, may be cleaned up)

**API Structure:**
- `/api/auth/*` - Authentication endpoints (register, login, profile)
- `/api/requests/*` - CRUD operations, comments, file uploads, assignment
- `/api/requests/my` - Get requests assigned to current user (employees/leads/admins)
- `/api/requests/department` - Get department requests (leads/admins only)
- `/api/departments/*` - Department and employee management
- `/api/notifications/*` - User notifications

**Key Features:**
- Sequelize ORM with PostgreSQL database
- JWT authentication with middleware protection
- File upload handling via Multer (50MB limit, restricted file types)
- Database-generated request numbers (REQ-XXXXXX format using PostgreSQL triggers)
- Request activity logging with tech assignments and time tracking
- Email notifications via Nodemailer
- Rate limiting and security headers
- ACID transactions for data consistency
- Role-based assignment workflow (admins can assign requests to employees)

### Frontend Architecture (React/Material-UI)

**Context & State:**
- `AuthContext` - Global authentication state, user profile, token management
- React Query for server state caching and synchronization
- React Hook Form for form validation and submission

**Route Structure:**
- Public routes: `/login`, `/register`
- Protected routes under `Layout` component with navigation
- Role-based routing (admin features only for admin users)

**Key Components:**
- `Layout` - Main app shell with navigation drawer and header
- `PrivateRoute` - Authentication guard wrapper
- `Dashboard` - Main dashboard with tab-based filtering and assignment functionality
- Request form components for different request types (Event, Web, Technical, Graphic)

**Dashboard Tab System:**
- **All Requests** - Shows all requests (available to all authenticated users)
- **Department** - Shows department-specific requests (leads only)
- **My Requests** - Shows requests assigned to current user (employees/leads/admins)

### Database Schema Relationships

**Current Request System Structure:**
- `requests` table with foreign keys to `users` (client_id, assigned_to, assigned_by)
- `event_requests`, `web_requests`, `technical_requests`, `graphic_requests` tables linked to main requests
- `request_activities` table for activity tracking with user references
- `departments` table with lead assignments
- `notifications` table linking users to notifications

**Data Integrity:**
- Foreign key constraints ensure referential integrity
- Check constraints for business rules (date validation, positive counts)
- PostgreSQL triggers for automatic request number generation and timestamps
- Clean separation between different request types

### Role-Based Access Control

**Client Role:**
- Create and view own requests
- Upload files to own requests
- Add comments to own requests
- Receive notifications for request updates

**Employee Role:**
- View requests assigned to them
- Update status of assigned requests
- Add comments and activity logs
- Track time spent on requests

**Lead Role:**
- All employee permissions
- View all requests in their department
- Assign requests within their department

**Admin Role:**
- View and manage all requests across all departments
- Assign requests to any employee in any department
- Manage departments and user assignments
- Access admin dashboard and assignment functionality

### Assignment Workflow

**Admin Assignment Process (Completed July 2025):**
1. Admin views unassigned requests in dashboard
2. Clicks assignment button to open assignment dialog
3. Selects department from dropdown (IT, Marketing, Operations, Finance)
4. Selects employee from department-specific employee list
5. System updates request with assignedTo, assignedBy, department, and sets status to 'in_progress'
6. Notifications sent to assigned employee and original client
7. Dashboard refreshes to show updated assignment

### File Upload System

- Uses Multer with disk storage in `backend/uploads/`
- Supports PDF, PowerPoint, Word, Excel, and image files
- Files served statically via `/uploads` endpoint
- Filename collision prevention with timestamp + random suffix

### Notification Architecture

- Database-driven notification system
- Email templates in `emailService.js`
- Notifications created on: request creation, status changes, assignments, new comments
- Support for marking individual/all notifications as read
- Fixed notification system after database cleanup (July 2025)

## Database Cleanup History

**July 22, 2025 - Complete System Cleanup:**
- **Removed all ticket-related database tables:** `tickets`, `ticket_equipment`, `ticket_status_history`, `ticket_comments`, `tech_activities`
- **Deleted ticket-related files:** 
  - Models: `Ticket.js`, `TicketComment.js`, `TicketEquipment.js`, `TicketStatusHistory.js`, `TechActivity.js`
  - Controllers: `ticketController.js`, `techController.js`
  - Routes: `ticketRoutes.js`, `techRoutes.js`
- **Updated existing files to remove ticket references:**
  - `models/index.js` - removed all ticket associations and exports
  - `server.js` - removed ticket and tech route imports
  - `controllers/requestController.js` - cleaned up notification references
  - `controllers/notificationController.js` - removed ticket includes
  - `controllers/departmentController.js` - removed ticket-related methods
  - `services/emailService.js` - converted from ticket to request notifications
- **Created database cleanup scripts:**
  - `database/final_cleanup.sql` - comprehensive cleanup script
  - `database/clean_requests_schema.sql` - clean schema for requests-only system
- **Maintained data integrity:** All request functionality preserved and working
- **System is now 100% request-based** with no remaining ticket dependencies

## User Setup

### Admin User Setup
```sql
-- Connect to PostgreSQL
psql -U postgres -d event_ticketing

-- Create admin user
INSERT INTO users (name, email, password, role, company) VALUES
('Admin User', 'your@email.com', '$2a$10$hashed_password', 'admin', 'Your Company');

-- Or update existing user to admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

### Department and Employee Setup
```sql
-- Create departments
INSERT INTO departments (name, description) VALUES
('IT', 'Information Technology Department'),
('Marketing', 'Marketing and Communications'),
('Operations', 'Operations and Logistics'),
('Finance', 'Finance and Accounting');

-- Assign users to departments
UPDATE users SET department = 'IT', role = 'employee' WHERE email = 'employee@example.com';
UPDATE users SET department = 'IT', role = 'lead' WHERE email = 'lead@example.com';
```

## Development Notes

### Adding New Request Types
1. Create new request type model (e.g., `NewRequest.js`)
2. Add associations in `backend/src/models/index.js`
3. Update request controller to handle new type
4. Add frontend form components
5. Update request type enum if using database enums

### Adding New Request Statuses
1. Update status enum in PostgreSQL if using database enums
2. Update Sequelize model validation
3. Update status color mapping in frontend components (`Dashboard.js`, etc.)

### Adding New Departments
1. Insert new department into `departments` table
2. Update department dropdown options in assignment dialog (`Dashboard.js` line 864-867)
3. Optionally assign a lead to the new department

### Database Migrations
- Use raw SQL for schema changes in production
- Sequelize sync only recommended for development
- Always backup before schema modifications
- Document major changes in this file

### Running Database Cleanup (July 22, 2025)
To clean up an existing database with ticket data and migrate to requests-only:

```bash
# Run the final cleanup script
psql -U postgres -d event_ticketing -f backend/database/final_cleanup.sql

# Or for a fresh installation, use the clean schema
psql -U postgres -d event_ticketing -f backend/database/clean_requests_schema.sql
```

**Important:** The cleanup script will remove ALL ticket-related data permanently. Backup your database before running.

### Recent Fixes and Updates (July 2025)

**Completed (July 22, 2025):**
- ✅ Migrated from ticket system to request system
- ✅ Implemented tab-based dashboard filtering (All Requests, Department, My Requests)
- ✅ Added admin assignment functionality with department selection
- ✅ Fixed notification system after database cleanup
- ✅ Resolved model association issues after ticket removal
- ✅ Updated API routes for request filtering (`/my`, `/department`)
- ✅ Fixed route ordering conflicts in request routes
- ✅ Implemented role-based tab visibility
- ✅ Added assignment dialog with employee selection
- ✅ Fixed database schema mismatches in Notification model
- ✅ **Fixed tab indexing issue** - employees now correctly see "My Requests" on tab 1, leads see proper tab sequence

**Completed (July 23, 2025):**
- ✅ **Audited all request types for data integrity** - Fixed major TechnicalRequest data loss issue
- ✅ **Enhanced TechnicalRequest model and database** - Added missing fields: `issueType`, `severity`, `stepsToReproduce`, `deviceInfo`, `errorMessages`, `attemptedSolutions`, `attachmentsPath`, `issueStarted`
- ✅ **Fixed department visibility for dept_leads** - Corrected access control so department leads only see requests from their department
- ✅ **Implemented automatic department routing** - Requests now automatically route to correct departments based on type (graphic→Graphic Design, web→Web Support, technical→IT Support, event→Event Management)
- ✅ **Created dynamic department routing system** - Added `request_routing` table for configurable request-to-department mapping without code changes
- ✅ **Added admin routing management API** - New endpoints for managing request routing: `GET/POST /api/departments/routing`
- ✅ **Fixed admin department dropdown** - Resolved empty dropdown issue in admin user management interface

**Completed (July 24, 2025):**
- ✅ **Enhanced Request Highlighting System** - Implemented comprehensive visual feedback for request updates
- ✅ **Unified Update Detection** - Combined unread messages and recent activity into single highlighting system
- ✅ **Cross-Role Highlighting** - Highlighting works for all user roles (user, employee, dept_lead, admin)
- ✅ **Activity Tracking Enhancement** - Added `hasRecentActivity` and `lastActivityAt` fields to all request endpoints
- ✅ **Persistent View Tracking** - LocalStorage-based system to track when users last viewed each request
- ✅ **UI/UX Improvements** - Replaced checkboxes with modern chip-based selection in Event Request forms
- ✅ **Deployment Documentation** - Created comprehensive cPanel deployment guide for production hosting

**Known Working Features:**
- Role-based dashboard access with proper tab filtering
- Admin assignment workflow with department/employee selection
- Request creation for all four types (Event, Web, Technical, Graphic) with full data capture
- Automatic department routing based on request type
- Activity logging and status updates
- Notification system for assignments and status changes
- File upload functionality for requests
- Dynamic department and user management (database-driven)
- Request type routing configuration (admin-configurable)
- **Enhanced request highlighting system with visual feedback for updates**
- **Modern chip-based UI components for better user experience**
- **Cross-role update detection and activity tracking**

### Dynamic Department Routing System (Added July 23, 2025)

The system now includes automatic request routing based on request type, with configurable department mappings:

**Database Table**: `request_routing`
- Stores request type to department mappings
- Allows runtime configuration without code changes
- Supports enabling/disabling routing rules

**Default Routing Rules**:
- `graphic` requests → `Graphic Design` department
- `web` requests → `Web Support` department  
- `technical` requests → `IT Support` department
- `event` requests → `Event Management` department

**Admin Management APIs**:
- `GET /api/departments/routing` - View current routing configuration
- `POST /api/departments/routing` - Update routing rules
- Example: `{ "requestType": "video", "departmentName": "Marketing" }`

**Benefits**:
- New departments automatically work with existing routing
- Department name changes cascade through foreign key constraints
- No code deployments needed for routing changes
- Admin-configurable through API (UI can be added later)

**Database Files**:
- Creation script: `backend/database/add_request_routing_table.sql`
- Migration included automatic default routing setup

### Enhanced Request Highlighting System (Added July 24, 2025)

The system now provides comprehensive visual feedback for request updates across all user roles:

**Key Features**:
- **Unified highlighting**: Single blue color scheme for all types of updates (messages, status changes, assignments)
- **Cross-role support**: Works for users, employees, department leads, and admins
- **Visual indicators**: Blue row highlighting with left border for requests with updates
- **Smart tracking**: LocalStorage-based system remembers when users last viewed each request
- **Activity detection**: Tracks activities from other users in the last 24 hours

**Backend Implementation**:
- Enhanced all request endpoints with activity tracking (`getRequests`, `getMyRequests`, `getDepartmentRequests`)
- Added `hasRecentActivity` boolean field to indicate requests with recent updates
- Added `lastActivityAt` timestamp field for tracking most recent activity
- Counts activities from other users in the last 24 hours for highlighting logic

**Frontend Implementation**:
- Updated `Dashboard.js` with unified highlighting logic
- Added persistent view tracking using LocalStorage (`viewedRequests`, `requestActivities`)
- Clean visual design with blue highlighting and bold request numbers
- Highlighting clears when user clicks and views the request

**What Triggers Highlighting**:
- Status updates by staff members
- New comments or messages from other users
- Request assignments and reassignments
- Any activity not performed by the current user

### Modern UI/UX Improvements (Added July 24, 2025)

**Event Request Form Enhancements**:
- **Replaced checkboxes with interactive chips** in Media Team/Equipment section
- **Visual feedback**: Selected equipment shows as filled blue chips with checkmark icons
- **Unselected equipment**: Outlined chips with empty circle icons
- **Click to toggle**: More intuitive than traditional checkboxes
- **Responsive design**: Chips wrap properly on mobile devices

**Implementation**:
- Updated `EventRequestForm.js` with Material-UI Chip components
- Added CheckCircle and RadioButtonUnchecked icons for visual feedback
- Improved spacing and layout with Stack components
- Maintained existing functionality while enhancing user experience

### User and Department Management Flexibility (Updated July 23, 2025)

**✅ What's Dynamic (No Code Changes Needed)**:
- **Department Assignment**: Users can be assigned to any department in database
- **New Departments**: Create departments, assign leads, route request types
- **Employee Management**: Add/edit/delete users with any existing department
- **Request Routing**: Configure which request types go to which departments

**❌ What Requires Code Changes**:
- **New User Roles**: Adding roles beyond `user`, `employee`, `dept_lead`, `admin` requires database enum updates
- **Role-Based Permissions**: New roles need controller permission updates

**API Endpoints for Dynamic Management**:
- `GET/POST/PUT/DELETE /api/departments/*` - Department CRUD
- `GET/POST/PUT/DELETE /api/admin/users/*` - User management
- `GET/POST /api/departments/routing` - Request routing configuration

### Production Deployment

#### DigitalOcean Droplet Specifications (Added July 28, 2025)

**Recommended Droplet Configuration for Production:**

**Basic Setup (Development/Small Team):**
- **Size**: Basic - $12/month
- **CPU**: 1 vCPU
- **Memory**: 2 GB RAM
- **Storage**: 50 GB SSD
- **Transfer**: 2 TB

**Production Ready (Recommended):**
- **Size**: Regular - $24/month  
- **CPU**: 2 vCPUs
- **Memory**: 4 GB RAM
- **Storage**: 80 GB SSD
- **Transfer**: 4 TB

**Additional Settings:**
- **OS**: Ubuntu 22.04 LTS
- **Datacenter**: Choose closest to your users
- **Authentication**: SSH keys (more secure than password)
- **Monitoring**: Enable monitoring
- **Backups**: Enable automatic backups (+20% cost)

**Stack Requirements Analysis:**
- **Node.js backend** (Express server): ~256-512MB RAM
- **React frontend** (served as static files): Minimal overhead
- **PostgreSQL database**: ~512MB-1GB RAM
- **File uploads**: Up to 50MB per file, requires adequate storage
- **OS + services**: ~512MB RAM
- **Buffer for growth**: Remaining RAM for scaling

**Deployment Process:**
1. Install Node.js, PostgreSQL, and Nginx
2. Clone `main` branch from repository
3. Set up database and environment variables
4. Configure Nginx as reverse proxy
5. Set up SSL certificate (Let's Encrypt)
6. Configure PM2 for process management

#### cPanel Deployment Support (Added July 24, 2025)

**cPanel Deployment Support**:
The system also includes comprehensive deployment documentation for cPanel hosting environments.

**Key cPanel Features**:
- **Node.js Application Setup**: Complete guide for configuring Node.js apps in cPanel
- **Database Configuration**: MySQL/PostgreSQL setup with proper credentials
- **File Structure Organization**: Optimized layout for cPanel public_html directory
- **Environment Configuration**: Production-ready .env setup with email and database settings
- **SSL and Security**: HTTPS enforcement and security headers configuration
- **Frontend Build Process**: React build optimization for production deployment

**Deployment Files**:
- cPanel-specific .htaccess configuration for URL routing
- Production environment variables template
- Database migration scripts for production setup
- Frontend build configuration for cPanel directory structure

**Supported Hosting Types**:
- **Subdomain deployment**: `requests.yourdomain.com`
- **Subdirectory deployment**: `yourdomain.com/requests`
- **Custom domain setup**: Full domain configuration

### Extending Email Templates
Email templates are defined in `backend/src/services/emailService.js` with support for request creation, status changes, assignments, and comment notifications.

### Key File Locations

**Frontend Components**:
- Main dashboard: `frontend/src/pages/Dashboard.js` (enhanced with highlighting system)
- Admin dashboard: `frontend/src/pages/AdminDashboard.js`
- Event request form: `frontend/src/components/forms/EventRequestForm.js` (updated with chip UI)
- Request detail page: `frontend/src/pages/RequestDetail.js`
- Other form components: `frontend/src/components/forms/` (TechnicalRequestForm, WebRequestForm, GraphicRequestForm)

**Backend Controllers**:
- Request controller: `backend/src/controllers/requestController.js` (enhanced with activity tracking)
- Department controller: `backend/src/controllers/departmentController.js` (includes routing management)
- Admin controller: `backend/src/controllers/adminController.js`
- Authentication controller: `backend/src/controllers/authController.js`
- Notification controller: `backend/src/controllers/notificationController.js`

**Backend Routes**:
- Request routes: `backend/src/routes/requestRoutes.js`
- Department routes: `backend/src/routes/departmentRoutes.js`
- Admin routes: `backend/src/routes/adminRoutes.js`
- Authentication routes: `backend/src/routes/authRoutes.js`

**Database & Models**:
- Model definitions: `backend/src/models/`
- Database associations: `backend/src/models/index.js`
- TechnicalRequest migration: `backend/database/update_technical_requests_table.sql`
- Request routing setup: `backend/database/add_request_routing_table.sql`
- Clean schema for fresh installs: `backend/database/clean_requests_schema.sql`

**Configuration Files**:
- API configuration: `frontend/src/config/api.js`
- Database configuration: `backend/src/config/database.js`
- Environment variables: `backend/.env` (template: `backend/.env.example`)