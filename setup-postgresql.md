# PostgreSQL Setup Guide

## 1. Install PostgreSQL

### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### On macOS (using Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

### On Windows:
Download and install from https://www.postgresql.org/download/windows/

## 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database
CREATE DATABASE event_ticketing;

# Create user (optional, you can use default postgres user)
CREATE USER event_user WITH PASSWORD 'your_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE event_ticketing TO event_user;

# Exit PostgreSQL
\q
```

## 3. Run Database Schema

```bash
# Connect to the database
psql -U postgres -d event_ticketing

# Or if using custom user:
psql -U event_user -d event_ticketing

# Run the schema file
\i backend/database/schema.sql

# Exit
\q
```

## 4. Configure Environment Variables

```bash
# Copy environment file
cp backend/.env.example backend/.env

# Edit the .env file with your database credentials
```

Update `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_ticketing
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (optional for testing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
CLIENT_URL=http://localhost:3000
```

## 5. Install Dependencies and Start

```bash
# Install backend dependencies
cd backend
npm install

# Start backend server
npm run dev

# In another terminal, install frontend dependencies
cd ../frontend
npm install

# Start frontend server
npm start
```

## 6. Default Admin User

The schema includes a default admin user:
- Email: admin@example.com
- Password: admin123

You can change this password after first login or create your own admin user:

```sql
-- Connect to database
psql -U postgres -d event_ticketing

-- Update existing admin password (hashed for 'newpassword')
UPDATE users 
SET password = '$2a$10$new_hashed_password_here' 
WHERE email = 'admin@example.com';

-- Or create new admin user
INSERT INTO users (name, email, password, role, company) VALUES
('Your Name', 'your@email.com', '$2a$10$hashed_password', 'admin', 'Your Company');
```

To hash a password for manual insertion, you can use an online bcrypt generator or run this in Node.js:

```javascript
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync('your_password', salt);
console.log(hash);
```

## 7. Verification

1. Backend should start on http://localhost:5000
2. Frontend should start on http://localhost:3000
3. You should be able to login with admin credentials
4. Database tables should be created and populated with sample equipment

## 8. Troubleshooting

### Connection Issues:
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database exists: `psql -U postgres -l`
- Check user permissions: `psql -U postgres -c "\du"`

### Authentication Issues:
- Ensure JWT_SECRET is set in .env
- Check if user exists in database
- Verify password hashing is working

### Database Issues:
- Check if all tables exist: `\dt` in psql
- Verify foreign key relationships
- Check for any constraint violations in logs