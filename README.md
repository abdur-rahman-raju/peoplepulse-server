# PeoplePulse Server

Express and MongoDB API for the PeoplePulse events platform. Requests are protected with JWT verified against the client's Better Auth JWKS.

**Live API:** https://peoplepulse-server-d15s.onrender.com

**Client repository:** https://github.com/abdur-rahman-raju/peoplepulse-client

## Features

- Public routes to list upcoming events with search, type filter and limit
- JWT-protected routes to create, update and delete events
- Only the creator can edit or delete an event
- Join and leave events with a unique join per user and live volunteer counts
- Server-side validation for every event field

## Run locally

1. Run `npm install`
2. Create a `.env` file with `MONGODB_URI`, `DB_NAME` and `CLIENT_URL`
3. Run `npm run dev`