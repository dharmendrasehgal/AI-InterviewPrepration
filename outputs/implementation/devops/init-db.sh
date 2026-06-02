#!/bin/bash
set -e

echo "Initialising database extensions for interviewprep..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";

  GRANT ALL PRIVILEGES ON DATABASE interviewprep TO app;
EOSQL

echo "Extensions enabled: uuid-ossp, pgcrypto, pg_trgm"
