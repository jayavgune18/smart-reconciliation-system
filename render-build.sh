#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies and build the client
cd client
npm install
npm run build

# Install dependencies for the server
cd ../server
npm install
