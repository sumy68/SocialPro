#!/bin/bash
set -e

echo "Building server..."
npm run build:server

echo "Copying schema.sql..."
mkdir -p dist/backend/db
cp src/backend/db/schema.sql dist/backend/db/

echo "Build complete!"
