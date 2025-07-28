#!/bin/bash

echo "Setting up PostgreSQL database for Event Ticketing System..."

# Create user and database as postgres superuser
sudo -u postgres psql << EOF
-- Create user
CREATE USER anthony WITH PASSWORD 'password123';

-- Create database
CREATE DATABASE event_ticketing OWNER anthony;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE event_ticketing TO anthony;

-- Exit
\q
EOF

echo "Database user and database created successfully!"

# Run schema as the new user
echo "Running database schema..."
psql -U anthony -d event_ticketing -f /home/anthony/HOl-TS/backend/database/schema.sql

echo "Database setup complete!"
echo ""
echo "Database Details:"
echo "- Database: event_ticketing"
echo "- User: anthony"
echo "- Password: password123"
echo ""
echo "You can now update your .env file with these credentials."