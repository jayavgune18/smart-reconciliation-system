# Smart Reconciliation & Audit System

## Overview
A full-stack MERN application for uploading transaction data, reconciling against system records, and maintaining audit trails.

## Features
- File upload with column mapping
- Reconciliation logic (exact, partial, duplicate)
- Dashboard with summaries and charts
- Audit timeline
- Role-based access (Admin, Analyst, Viewer)

## Setup
1. Install dependencies: `npm install` in server/ and client/.
2. Start MongoDB and Redis.
3. Run backend: `cd server && npm start`.
4. Run frontend: `cd client && npm start`.
5. Seed data: `cd server && node seed.js`.

## API Docs
Use Postman for endpoints like /api/upload, /api/reconcile/summary.