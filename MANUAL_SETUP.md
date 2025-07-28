# Manual PostgreSQL Setup Instructions

Since PostgreSQL requires interactive sudo access, please run these commands manually:

## 1. Create PostgreSQL User and Database

```bash
# Switch to postgres user and run psql
sudo -u postgres psql

# In the PostgreSQL prompt, run:
CREATE USER anthony WITH PASSWORD 'password123';
CREATE DATABASE event_ticketing OWNER anthony;
GRANT ALL PRIVILEGES ON DATABASE event_ticketing TO anthony;
\q
```

## 2. Run Database Schema

```bash
# Run the schema file
psql -U anthony -d event_ticketing -f /home/anthony/HOl-TS/backend/database/schema.sql
```

## 3. Verify Setup

```bash
# Test connection
psql -U anthony -d event_ticketing -c "SELECT COUNT(*) FROM users;"
```

You should see output showing 1 user (the default admin).

## 4. Start the Application

```bash
# Start backend
cd /home/anthony/HOl-TS/backend
npm run dev

# In another terminal, start frontend
cd /home/anthony/HOl-TS/frontend
npm start
```

## Alternative: Use Docker (if preferred)

If you prefer to use Docker for PostgreSQL:

```bash
# Run PostgreSQL in Docker
docker run --name postgres-ticketing -e POSTGRES_PASSWORD=password123 -e POSTGRES_USER=anthony -e POSTGRES_DB=event_ticketing -p 5432:5432 -d postgres:15

# Wait a few seconds, then run schema
psql -h localhost -U anthony -d event_ticketing -f /home/anthony/HOl-TS/backend/database/schema.sql
```

## Database Credentials

The .env file is already configured with:
- Database: event_ticketing
- User: anthony
- Password: password123
- Host: localhost
- Port: 5432

## Default Admin User

- Email: admin@example.com
- Password: admin123

## Troubleshooting

If you get authentication errors:
1. Check that the PostgreSQL user was created successfully
2. Verify the database exists: `psql -U anthony -l`
3. Check the .env file has correct credentials
4. Ensure PostgreSQL is running: `pg_isready`