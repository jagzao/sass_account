#!/bin/bash

# Database Backup Script for D1
# This script exports the D1 database and optionally uploads to R2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DATABASE_NAME="fiscal_platform_db"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="backup-${DATE}.sql"

echo -e "${YELLOW}🔄 Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Export database
echo -e "${YELLOW}📤 Exporting database: $DATABASE_NAME${NC}"
wrangler d1 export "$DATABASE_NAME" --remote --output "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database exported successfully!${NC}"
    echo -e "${GREEN}📁 Backup saved to: $BACKUP_DIR/$BACKUP_FILE${NC}"

    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}📊 Backup size: $FILE_SIZE${NC}"

    # Optional: Upload to R2 (uncomment if you have R2 configured)
    # echo -e "${YELLOW}☁️  Uploading to R2...${NC}"
    # wrangler r2 object put "backups/$BACKUP_FILE" --file="$BACKUP_DIR/$BACKUP_FILE"

    # Clean up old backups (keep last 30 days)
    echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
    find "$BACKUP_DIR" -name "backup-*.sql" -type f -mtime +30 -delete

    echo -e "${GREEN}✨ Backup completed successfully!${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi
