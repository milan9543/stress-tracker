#!/bin/bash
# This script helps you interact with the SQLite database from outside the Docker container

# Ensure the db_data directory exists
mkdir -p ./db_data

# Function to display help
show_help() {
  echo "SQLite Database Access Tool"
  echo ""
  echo "This script helps you interact with the SQLite database from outside the Docker container."
  echo ""
  echo "Usage:"
  echo "  ./db-tools.sh [OPTION]"
  echo ""
  echo "Options:"
  echo "  open    - Open the SQLite database in interactive mode"
  echo "  backup  - Create a backup of the database"
  echo "  restore - Restore the database from the latest backup"
  echo "  help    - Display this help message"
  echo ""
}

# Check if sqlite3 is installed
check_sqlite() {
  if ! command -v sqlite3 &> /dev/null; then
    echo "Error: sqlite3 is not installed."
    echo "Please install it using your package manager:"
    echo "  macOS: brew install sqlite"
    echo "  Ubuntu/Debian: sudo apt-get install sqlite3"
    exit 1
  fi
}

# Open the database in interactive mode
open_db() {
  check_sqlite
  echo "Opening SQLite database in interactive mode..."
  echo "Type .help for usage instructions or .exit to quit"
  echo ""
  sqlite3 ./db_data/stress-tracker.db
}

# Backup the database
backup_db() {
  check_sqlite
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  mkdir -p ./db_backups
  echo "Creating backup of SQLite database..."
  sqlite3 ./db_data/stress-tracker.db ".backup ./db_backups/stress-tracker_${TIMESTAMP}.db"
  echo "Backup created: ./db_backups/stress-tracker_${TIMESTAMP}.db"
}

# Restore the database from backup
restore_db() {
  check_sqlite
  
  # List all backups
  echo "Available backups:"
  ls -lt ./db_backups | grep -v "^total" | head -n 10
  
  echo ""
  echo "Enter the backup filename to restore from (or CTRL+C to cancel):"
  read BACKUP_FILE
  
  if [ ! -f "./db_backups/$BACKUP_FILE" ]; then
    echo "Error: Backup file not found!"
    exit 1
  fi
  
  echo "Warning: This will overwrite your current database. Are you sure? (y/n)"
  read CONFIRM
  
  if [ "$CONFIRM" = "y" ]; then
    echo "Stopping Docker container to avoid conflicts..."
    docker compose stop backend
    
    echo "Restoring database from backup..."
    cp "./db_backups/$BACKUP_FILE" ./db_data/stress-tracker.db
    
    echo "Restarting Docker container..."
    docker compose start backend
    
    echo "Restoration complete!"
  else
    echo "Restoration cancelled."
  fi
}

# Main script logic
case "$1" in
  open)
    open_db
    ;;
  backup)
    backup_db
    ;;
  restore)
    restore_db
    ;;
  help|*)
    show_help
    ;;
esac