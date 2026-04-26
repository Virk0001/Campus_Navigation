# Smart Navigator

Smart Navigator is a campus navigation and event discovery platform for Thapar Institute of Engineering and Technology. It combines an interactive campus map, searchable locations, role-based dashboards, and event-aware routing so students, organizers, and admins can manage and explore campus information from one place.

## Current Highlights

- Interactive Leaflet map with custom location and event markers
- Search and filter support for location types and live event categories
- Route planner with separate start and destination selection, swap, and clear actions
- Event-aware map experience that shows active events directly on the campus map
- Admin and organizer dashboards for managing users, locations, and events
- Firebase Authentication and Firestore-backed data flow
- Responsive frontend built with React, TypeScript, and Tailwind CSS

## Features

### Map and Navigation

- Campus map with custom marker styling for locations and events
- Search for places across the campus map
- Filter locations by type
- Filter events by category
- Toggle map visibility between all items, locations only, or events only
- Route planner with:
  - dedicated start and destination slots
  - map-click and marker-click route selection
  - waypoint markers for both ends of the route
  - swap and clear controls
  - inline route summary and step navigation

### Events

- Create and manage events from the admin dashboard
- Automatic event status handling for upcoming, ongoing, completed, and cancelled events
- Active event markers displayed on the map
- Event-location linking so event markers can reuse saved campus locations
- Category-based filtering on the map

### Admin and Access Control

- Role-based access for students, organizers, and admins
- Organizer creation and verification scripts
- Admin dashboards for users, events, and locations
- Firebase-based authentication with backend verification

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Leaflet
- Zustand
- Axios

### Backend

- Node.js
- Express
- Firebase Admin SDK
- Firestore
- Vercel serverless API under `api/`

## Project Structure

```text
SmartNav-main/
|-- api/                # Vercel serverless API
|-- backend/            # Express backend and admin scripts
|-- frontend/           # React + TypeScript application
|-- logos/              # Branding assets
|-- README.md
|-- package.json
|-- docker-compose.yml
`-- vercel.json
```

## Prerequisites

- Node.js 18 or newer
- npm
- A Firebase project with:
  - Authentication enabled
  - Firestore enabled
  - Service account credentials for admin access

## Installation

```bash

cd SmartNav-main
npm run install:all
```

## Environment Setup

Create and fill the environment files used by the frontend and backend.

### Backend

Create `backend/.env` and provide at least:

```bash
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Frontend

Create `frontend/.env` with your client Firebase configuration and API base URL as required by the frontend app.

## Running Locally

Start both frontend and backend:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:frontend
npm run dev:backend
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Useful Commands

### Root

```bash
npm run install:all
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run type-check
npm run test
```

### Backend

```bash
cd backend
npm run dev
npm run start
npm run lint
npm run test
npm run seed
```

## Admin and Seed Scripts

The backend contains helper scripts for bootstrapping and maintaining Firebase-backed admin data:

```bash
cd backend
node scripts/createOrganizers.js
node scripts/checkUserRoles.js
node scripts/verifyUserCreation.js
node scripts/deleteAllUsers.js
node scripts/seedFirebaseLocations.js
node scripts/seedThaparLocations.js
```

These scripts require the Firebase admin environment variables listed above.

## Deployment

This project includes a Vercel-ready API layer in `api/` and also keeps the Express backend for local development and admin workflows.

Relevant deployment files:

- `vercel.json`
- `DEPLOYMENT_GUIDE.md`
- `vercel-env-variables.txt`

## Notes on Current Map Behavior

- Active events on the map include ongoing and upcoming events.
- Event categories in the filter panel are generated from currently active events.
- Route planning works by selecting a start point and a destination from either map clicks or existing markers.
- Event and location visibility can be switched directly from the map filters.

## Status

This README reflects the current project state as of April 26, 2026, including the recent map filtering and route-planning improvements.
