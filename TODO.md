# SkillMirror MERN Cleanup Plan

## 1. Delete Unnecessary Files and Folders
- [ ] Delete all node_modules/ folders (root, client/, server/)
- [ ] Delete client/dist/
- [ ] Delete assets/ (root build output)
- [ ] Delete .env and .env.production files
- [ ] Delete .github/ folder
- [ ] Delete client/public/_redirects
- [ ] Delete root index.html, .nojekyll, san.svg
- [ ] Delete any other build/cache files

## 2. Create Environment Templates
- [ ] Create client/.env.example with VITE_API_BASE_URL=http://localhost:5000
- [ ] Create server/.env.example with PORT=5000, MONGODB_URI=, JWT_SECRET=

## 3. Standardize Backend
- [ ] Rename server/src/server.js to server/src/index.js
- [ ] Update server/package.json "main" and "start" script
- [ ] Update root package.json "main" reference
- [ ] Add global error handling middleware to server/src/app.js
- [ ] Ensure proper middleware order in app.js

## 4. Standardize Frontend
- [ ] Remove "homepage" from client/package.json
- [ ] Remove "deploy" script from client/package.json
- [ ] Ensure client/src/utils/api.js uses env var correctly

## 5. Update Root Structure
- [ ] Ensure root only has package.json, package-lock.json, README.md, .gitignore

## 6. Final Verification
- [ ] Run npm install in root, client, server
- [ ] Test local development setup
- [ ] Confirm clean structure and no hardcoded URLs
