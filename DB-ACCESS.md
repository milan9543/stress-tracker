# Working with the SQLite Database

This document explains how to access and manage the SQLite database used by the Stress Tracker application.

## Database Access from Outside Docker

We've configured the Docker setup to expose the SQLite database file to the host machine. This allows you to:

1. Access the database directly with SQLite tools
2. Create backups and restore data
3. Inspect and modify data for debugging purposes

## Database Location

The database file is mapped from the Docker container to the host machine at:

```
./db_data/stress-tracker.db
```

This directory will be created when you start the Docker containers.

## Using the Database Tools

We've provided a helper script to make working with the database easier. Make it executable first:

```bash
chmod +x db-tools.sh
```

Then you can use it as follows:

### Open the Database in Interactive Mode

```bash
./db-tools.sh open
```

This opens the SQLite database in interactive mode. You can use SQL commands to query and modify data:

```sql
-- Show all tables
.tables

-- View schema for a specific table
.schema stress_entries

-- Query data
SELECT * FROM users LIMIT 10;
```

### Create a Database Backup

```bash
./db-tools.sh backup
```

This creates a timestamped backup of the database in the `db_backups` directory.

### Restore from a Backup

```bash
./db-tools.sh restore
```

This will:

1. List available backups
2. Prompt you to select a backup file
3. Stop the backend container
4. Restore the database
5. Restart the backend container

## Manual Database Operations

If you prefer to work with the database directly:

```bash
# View the database with SQLite
sqlite3 ./db_data/stress-tracker.db

# Create a manual backup
cp ./db_data/stress-tracker.db ./my-backup.db

# Restore a manual backup (stop container first)
docker compose stop backend
cp ./my-backup.db ./db_data/stress-tracker.db
docker compose start backend
```

## Important Notes

1. Always stop the backend container before directly modifying the database file to prevent corruption.
2. Regular backups are recommended if you're experimenting with the database.
3. Be careful with DELETE or UPDATE operations, as they can cause the application to malfunction.
