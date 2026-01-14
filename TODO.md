# MERN Stack Deployment Plan

## Information Gathered
- Frontend: React (Vite) in /client
- Backend: Express + MongoDB in /server
- MongoDB Atlas connection works
- Skills data exists at /api/skills
- Previous separate deployments caused CORS, API path, and 404 issues

## Plan
- [x] Update server/src/app.js to serve React static files and handle client-side routing
- [x] Update root package.json for monorepo deployment scripts
- [x] Update client/src/utils/api.js to use relative API paths
- [x] Ensure server/src/server.js is correct (no changes needed)
- [x] Update client/vite.config.js for production build (if needed)

## Dependent Files to Edit
- server/src/app.js: Added static file serving and catch-all route
- package.json: Updated for monorepo setup
- client/src/utils/api.js: Changed API_BASE_URL to empty string for relative paths

## Followup Steps
- [ ] Test locally: npm run build && npm start
- [ ] Deploy to Render as Web Service
- [ ] Set environment variables in Render (MONGO_URI, JWT_SECRET, etc.)
- [ ] Verify frontend loads and API calls work
