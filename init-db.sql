-- Email-Makers Database Initialization Script
-- This script sets up the database for the Email-Makers project

-- Create the database if it doesn't exist
-- (Note: This is handled by POSTGRES_DB environment variable)

-- Create extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant necessary permissions to the user
GRANT ALL PRIVILEGES ON DATABASE email_makers TO email_makers_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO email_makers_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO email_makers_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO email_makers_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO email_makers_user;

-- Create a comment for the database
COMMENT ON DATABASE email_makers IS 'Email-Makers AI-powered email template generation platform database'; 