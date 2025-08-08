# Client Setup Guide - Houses of Light Request Management System

## Project Status ✅
All JSON files and database configurations have been verified and are working correctly.

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database server running
- Git installed

## Step-by-Step Setup Instructions

### 1. Clone the Repository
```bash
git clone [your-repository-url]
cd HOl-TS
```

### 2. Verify File Integrity
After cloning, verify that these key files exist:
```bash
ls -la frontend/package.json        # Should exist
ls -la backend/package.json         # Should exist  
ls -la frontend/package-lock.json   # Should exist
ls -la backend/package-lock.json    # Should exist
```

If any package.json files are missing, this indicates a Git clone issue. Try:
```bash
git reset --hard HEAD
git clean -fd
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials:
# DB_USER=your_db_user
# DB_PASSWORD=your_db_password
# DB_NAME=event_ticketing
# JWT_SECRET=your-secret-key

# Test database connection
node -e "const { Pool } = require('pg'); const pool = new Pool({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME }); pool.query('SELECT 1', (err, res) => { if(err) console.error('DB Error:', err); else console.log('✅ Database connected'); pool.end(); });"
```

### 4. Database Setup
```bash
# Create database (if not exists)
createdb event_ticketing

# Run schema
psql -d event_ticketing -f database/schema.sql
```

### 5. Frontend Setup
```bash
cd ../frontend

# Install dependencies  
npm install

# Verify React scripts
npm run build
```

### 6. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

## Common Issues & Solutions

### "malformed package.json" Error
This usually means:
1. **Incomplete Git clone** - Try: `git reset --hard HEAD && git pull`
2. **File corruption during download** - Re-clone the repository
3. **Missing files** - Ensure all package.json files exist as listed above

### JSON Validation Check
Run this in each directory to verify JSON files:
```bash
# Frontend
cd frontend
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('✅ Frontend package.json valid');"

# Backend  
cd backend
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('✅ Backend package.json valid');"
```

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check .env credentials match your database setup
3. Verify database exists: `psql -l | grep event_ticketing`

## Project Structure Verification
After setup, you should have:
```
HOl-TS/
├── backend/
│   ├── package.json ✅
│   ├── package-lock.json ✅
│   ├── .env ✅
│   └── src/...
├── frontend/
│   ├── package.json ✅
│   ├── package-lock.json ✅
│   └── src/...
└── database/
    └── schema.sql ✅
```

## Getting Help
If you continue experiencing JSON errors:
1. Check Git clone completed successfully
2. Verify Node.js version (18+)
3. Try deleting `node_modules/` and running `npm install` again
4. Check file permissions on package.json files

## Latest Updates ✅
- Database schema: Up to date with request-based system
- All JSON files: Validated and working
- Environment files: Present and configured
- Git tracking: All necessary files committed

The project is ready for deployment. Most "malformed package.json" errors are due to incomplete Git clones or missing dependencies.