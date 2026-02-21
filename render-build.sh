#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies and build the client
echo "Building client..."
cd client
npm install
CI=false npm run build

# Install dependencies for the server
echo "Installing server dependencies..."
cd ../server
npm install
echo "Build complete."
