# Event Ticketing System

A comprehensive ticketing system for managing event requests with equipment tracking, file uploads, and notification system.

## Features

- **Client Portal**: Submit tickets for events with equipment requests
- **Authentication**: Secure login/registration system
- **File Upload**: Upload presentations and documents
- **Equipment Management**: Select required equipment from catalog
- **Status Tracking**: Real-time ticket status updates
- **Notifications**: Email and in-app notifications
- **Admin Dashboard**: Manage tickets and equipment
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Nodemailer for emails
- Express validation

**Frontend:**
- React 18
- Material-UI (MUI)
- React Router
- React Query
- React Hook Form
- Axios

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-ticketing
JWT_SECRET=your-super-secret-jwt-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_URL=http://localhost:3000
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Default Admin Account

To create an admin user, register normally and then update the user role in MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tickets
- `GET /api/tickets` - Get user tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/comments` - Add comment
- `POST /api/tickets/:id/upload` - Upload file

### Equipment
- `GET /api/equipment` - Get equipment list
- `POST /api/equipment` - Create equipment (admin)
- `PUT /api/equipment/:id` - Update equipment (admin)
- `DELETE /api/equipment/:id` - Delete equipment (admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Usage

### For Clients

1. **Register/Login**: Create an account or sign in
2. **Create Ticket**: Click "New Ticket" to submit event request
3. **Fill Details**: Enter event information, dates, venue, attendee count
4. **Select Equipment**: Choose required audio/visual equipment
5. **Upload Files**: Add presentation files if needed
6. **Track Progress**: Monitor ticket status in dashboard
7. **Get Notifications**: Receive updates via email and in-app

### For Admins

1. **Access Admin Panel**: Available in navigation for admin users
2. **Manage Tickets**: View all tickets, update status, assign staff
3. **Equipment Catalog**: Add/edit/remove available equipment
4. **User Management**: View client information and ticket history

## File Upload

Supported file types:
- PDF documents
- PowerPoint presentations (.ppt, .pptx)
- Word documents (.doc, .docx)
- Excel files (.xls, .xlsx)
- Images (JPG, PNG, GIF)

Maximum file size: 50MB

## Email Notifications

The system sends email notifications for:
- Ticket creation confirmation
- Status changes
- New comments added
- Ticket assignments (admin)

## Database Schema

### User
- name, email, password
- role (client/admin)
- company, phone
- timestamps
1
### Ticket
- ticketNumber (auto-generated)
- client reference
- event details (name, type, description)
- dates (start/end)
- venue, attendee count
- equipment references
- status, priority
- file uploads
- comments, status history

### Equipment
- name, category
- description, specifications
- quantity, availability

### Notification
- recipient, ticket reference
- type, title, message
- read status, email sent status

## Development

### Adding New Equipment Categories

1. Update the Equipment model enum in `backend/src/models/Equipment.js`
2. Update the frontend form in `src/pages/TicketForm.js`

### Adding New Ticket Statuses

1. Update the Ticket model enum in `backend/src/models/Ticket.js`
2. Update status colors in frontend components

### Customizing Email Templates

Edit templates in `backend/src/services/emailService.js`

## Production Deployment

1. Set NODE_ENV=production
2. Update CORS settings for production domain
3. Use process manager like PM2
4. Set up reverse proxy with Nginx
5. Use cloud MongoDB service
6. Configure email service (SendGrid, etc.)

## License

MIT License - see LICENSE file for details